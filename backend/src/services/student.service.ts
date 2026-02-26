import * as XLSX from 'xlsx';
import { AppDataSource } from '../config/data-source';
import { Student } from '../entities/Student';
import { Section } from '../entities/Section';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { ApiError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

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

    if (search) {
      qb.andWhere(
        '(student.full_name ILIKE :search OR student.student_number ILIKE :search OR user.national_id ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (section_id) {
      qb.andWhere('student.sectionId = :section_id', { section_id }); // Or section_id, depends on DB schema but usually TypeORM maps section to sectionId.
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
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getById(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['section', 'user'],
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
      password,
    } = data;

    let section = null;
    if (section_id) {
      section = await this.sectionRepository.findOne({
        where: { id: section_id },
      });
      if (!section) throw new ApiError(400, 'الشعبة غير موجودة.');
    }

    const studentRole = await this.roleRepository.findOne({
      where: { name: 'student' },
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
      password,
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
          where: { id: section_id },
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

    // Deleting the user will cascade and delete the student because of the setup,
    // but doing it explicitly guarantees both are wiped.
    return await AppDataSource.transaction(async (manager) => {
      if (student.user) {
        await manager.remove(User, student.user);
      }
      return await manager.remove(Student, student);
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
      where: { name: 'student' },
    });
    if (!studentRole) throw new ApiError(500, 'صلاحية الطالب غير معرفة.');

    const section = sectionId
      ? await this.sectionRepository.findOne({ where: { id: sectionId } })
      : null;

    for (const row of data) {
      try {
        const { national_id, full_name, student_number } = row;

        if (!national_id || !full_name) {
          errors.push(`بيانات ناقصة في الصف: ${JSON.stringify(row)}`);
          continue;
        }

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
          where: [{ national_id: String(national_id) }],
        });

        if (existingUser) {
          errors.push(`الرقم القومي ${national_id} مسجل مسبقاً.`);
          continue;
        }

        await AppDataSource.transaction(async (manager) => {
          const user = new User();
          user.national_id = String(national_id);
          user.username = String(student_number || national_id);
          user.email = `${national_id}@sems.local`;
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(
            String(student_number || national_id),
            salt,
          );
          user.role = studentRole;
          const savedUser = await manager.save(User, user);

          const student = new Student();
          student.full_name = String(full_name);
          student.student_number = String(student_number || national_id);
          student.user = savedUser;
          if (section) student.section = section;
          await manager.save(Student, student);

          successCount++;
        });
      } catch (err: any) {
        errors.push(`خطأ في استيراد ${row.full_name}: ${err.message}`);
      }
    }

    return { success: successCount, errors };
  }
}
