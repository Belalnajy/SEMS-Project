import * as XLSX from 'xlsx';
import { AppDataSource } from '../config/data-source';
import { Student } from '../entities/Student';
import { Section } from '../entities/Section';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { Result } from '../entities/Result';
import { ApiError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';

export class StudentService {
  private studentRepository = AppDataSource.getRepository(Student);
  private sectionRepository = AppDataSource.getRepository(Section);
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);

  async getAll(query: any = {}) {
    const { page = 1, limit = 20, search, section_id } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.section', 'section')
      .leftJoinAndSelect('student.user', 'user')
      .orderBy('student.id', 'DESC');

    if (search && String(search).trim() !== '') {
      const term = `%${String(search).trim()}%`;
      qb.andWhere(
        '(student.full_name ILIKE :search OR student.student_number ILIKE :search OR user.national_id ILIKE :search OR section.name ILIKE :search)',
        { search: term }
      );
    }

    if (section_id !== undefined && section_id !== null && String(section_id).trim() !== '') {
      const sectionIdNum = Number(section_id);
      if (!isNaN(sectionIdNum)) {
        qb.andWhere('student.section_id = :section_id', { section_id: sectionIdNum });
      }
    }

    const [students, total] = await qb
      .skip(skip)
      .take(Number(limit))
      .getManyAndCount();

    return {
      students,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  async getById(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['section', 'user']
    });
    if (!student) throw new ApiError(404, 'الطالب غير موجود.');
    return student;
  }

  async create(data: any) {
    const {
      full_name,
      national_id,
      student_number,
      section_id,
      email,
      password
    } = data;

    let section = null;
    if (section_id) {
      section = await this.sectionRepository.findOne({
        where: { id: section_id }
      });
      if (!section) throw new ApiError(400, 'الشعبة غير موجودة.');
    }

    const studentRole = await this.roleRepository.findOne({
      where: { name: 'student' }
    });
    if (!studentRole)
      throw new ApiError(500, 'صلاحية الطالب غير معرفة في النظام.');

    return await AppDataSource.transaction(async (manager) => {
      // 1. Create User
      const user = new User();
      user.national_id = national_id;
      user.username = student_number || national_id;
      user.email = email || `${national_id}@sems.local`;

      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password || '123456', salt);
      user.role = studentRole;

      const savedUser = await manager.save(User, user);

      // 2. Create Student
      const student = new Student();
      student.full_name = full_name;
      student.student_number = student_number || national_id;
      student.section = section as Section;
      student.user = savedUser;

      return await manager.save(Student, student);
    });
  }

  async update(id: number, data: any) {
    const student = await this.getById(id);
    const {
      full_name,
      student_number,
      section_id,
      national_id,
      email,
      password
    } = data;

    return await AppDataSource.transaction(async (manager) => {
      // 1. Update User if needed
      if (student.user) {
        if (national_id) student.user.national_id = national_id;
        if (email) student.user.email = email;
        if (password && password.trim() !== '') {
          const salt = await bcrypt.genSalt(10);
          student.user.password_hash = await bcrypt.hash(password, salt);
        }
        await manager.save(User, student.user);
      }

      // 2. Update Student
      if (section_id) {
        const section = await this.sectionRepository.findOne({
          where: { id: section_id }
        });
        if (!section) throw new ApiError(400, 'الفصل غير موجود.');
        student.section = section;
      }

      if (full_name) student.full_name = full_name;
      if (student_number) student.student_number = student_number;

      return await manager.save(Student, student);
    });
  }

  async delete(id: number) {
    const student = await this.getById(id);

    return await AppDataSource.transaction(async (manager) => {
      // Ensure dependent results are removed even if DB-level cascades differ per environment.
      await manager
        .createQueryBuilder()
        .delete()
        .from(Result)
        .where('student_id = :studentId', { studentId: student.id })
        .execute();

      // Delete student first, then linked user to avoid FK issues in some schemas.
      await manager.remove(Student, student);

      if (student.user) {
        await manager.remove(User, student.user);
      }

      return { deleted: true };
    });
  }

  async deleteWithoutSection() {
    const students = await this.studentRepository.find({
      where: { section: IsNull() },
      relations: ['user'],
    });

    if (!students.length) {
      return { deleted: 0 };
    }

    const ids = students.map((s) => s.id);
    const users = students
      .map((s) => s.user)
      .filter((u): u is User => !!u);

    return await AppDataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(Result)
        .where('student_id IN (:...ids)', { ids })
        .execute();

      await manager.remove(Student, students);

      if (users.length) {
        await manager.remove(User, users);
      }

      return { deleted: students.length };
    });
  }

  async importFromExcel(buffer: Buffer, sectionId?: number) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    let successCount = 0;
    const errors: string[] = [];

    const studentRole = await this.roleRepository.findOne({
      where: { name: 'student' }
    });
    if (!studentRole) throw new ApiError(500, 'صلاحية الطالب غير معرفة.');

    const section = sectionId
      ? await this.sectionRepository.findOne({ where: { id: sectionId } })
      : null;

    console.log(
      `[Import] Starting import from Excel. Rows found: ${data.length}`
    );

    for (const row of data) {
      try {
        // Find values using flexible mapping (Normalize keys to lowercase for easier matching)
        const rowKeys = Object.keys(row);
        const findVal = (possibleNames: string[]) => {
          const key = rowKeys.find((k) =>
            possibleNames.some(
              (p) => k.trim().toLowerCase() === p.toLowerCase()
            )
          );
          return key ? row[key] : null;
        };

        const full_name = findVal([
          'full_name',
          'الاسم',
          'الاسم بالكامل',
          'اسم الطالب',
          'اسم الطالبة',
          'Full Name',
          'Name'
        ]);
        const national_id = findVal([
          'national_id',
          'الرقم الهوية',
          'رقم البطاقة',
          'رقم الطالبة',
          'National ID',
          'ID Number'
        ]);
        const student_number = findVal([
          'student_number',
          'كود الطالب',
          'رقم الجلوس',
          'رقم الطالب',
          'رقم الطالبة',
          'Student Number',
          'Student Code'
        ]);

        if (!national_id || !full_name) {
          console.log(`[Import] Missing data in row: ${JSON.stringify(row)}`);
          errors.push(
            `بيانات ناقصة في الصف: ${JSON.stringify(row)}. تأكد من وجود أعمدة (الاسم، الرقم الهوية)`
          );
          continue;
        }

        const cleanNationalId = String(national_id).trim();
        const cleanFullName = String(full_name).trim();
        const cleanStudentNumber = student_number
          ? String(student_number).trim()
          : cleanNationalId;

        console.log(
          `[Import] Processing student: ${cleanFullName} (ID: ${cleanNationalId})`
        );

        // Check if user already exists (by national_id)
        const existingUser = await this.userRepository.findOne({
          where: { national_id: cleanNationalId }
        });

        if (existingUser) {
          console.log(
            `[Import] National ID ${cleanNationalId} already exists.`
          );
          errors.push(
            `الرقم الهوية ${cleanNationalId} مسجل مسبقاً (طالب: ${cleanFullName})`
          );
          continue;
        }

        // Check if student number exists
        const existingStudent = await this.studentRepository.findOne({
          where: { student_number: cleanStudentNumber }
        });

        if (existingStudent) {
          console.log(
            `[Import] Student number ${cleanStudentNumber} already exists.`
          );
          errors.push(
            `كود الطالب ${cleanStudentNumber} مسجل مسبقاً (طالب: ${existingStudent.full_name})`
          );
          continue;
        }

        await AppDataSource.transaction(async (manager) => {
          const user = new User();
          user.national_id = cleanNationalId;
          user.username = cleanStudentNumber;
          user.email = `${cleanNationalId}@sems.local`;
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(cleanStudentNumber, salt);
          user.role = studentRole;
          const savedUser = await manager.save(User, user);

          const student = new Student();
          student.full_name = cleanFullName;
          student.student_number = cleanStudentNumber;
          student.user = savedUser;
          if (section) student.section = section;
          await manager.save(Student, student);

          console.log(`[Import] Successfully saved student: ${cleanFullName}`);
          successCount++;
        });
      } catch (err: any) {
        console.error(`[Import] Error processing row:`, err);
        errors.push(
          `خطأ في استيراد ${row.full_name || row['الاسم'] || 'طالب غير محدد'}: ${err.message}`
        );
      }
    }

    console.log(
      `[Import] Finished. Success: ${successCount}, Errors: ${errors.length}`
    );
    return { success: successCount, errors };
  }
}
