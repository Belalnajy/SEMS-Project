import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { Student } from '../entities/Student';
import { ApiError } from '../middleware/errorHandler';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);
  private studentRepository = AppDataSource.getRepository(Student);

  async register(data: any): Promise<{ user: Partial<User>; token: string }> {
    const {
      national_id,
      username,
      email,
      password,
      role_name,
      full_name,
      student_number
    } = data;

    // Check existing
    const existing = await this.userRepository.findOne({
      where: [{ national_id }, { email }, { username }]
    });
    if (existing) {
      throw new ApiError(
        400,
        'البيانات (الرقم الهوية أو البريد أو اسم المستخدم) مسجلة مسبقاً.'
      );
    }

    // Force role to 'student' for public registration
    const role = await this.roleRepository.findOne({
      where: { name: 'student' }
    });
    if (!role) {
      throw new ApiError(400, 'الصلاحية المطلوبة غير صحيحة.');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Use transaction for Student creation
    return await AppDataSource.transaction(async (manager) => {
      const user = new User();
      user.national_id = national_id;
      user.username = username || national_id;
      user.email = email;
      user.password_hash = password_hash;
      user.role = role;

      const savedUser = await manager.save(User, user);

      if (role.name === 'student') {
        const student = new Student();
        student.user = savedUser;
        student.full_name = full_name || username;
        student.student_number = student_number;
        await manager.save(Student, student);
      }

      const token = this.generateToken(savedUser.id, role.name);

      const { password_hash: _, ...userWithoutPassword } = savedUser;
      return { user: userWithoutPassword, token };
    });
  }

  async login(data: any): Promise<{ user: Partial<User>; token: string }> {
    const { national_id: raw_id, password } = data;
    const national_id = String(raw_id).trim();

    const user = await this.userRepository.findOne({
      where: { national_id: String(national_id) },
      relations: ['role', 'student', 'student.section']
    });

    console.log(
      `[Login] Attempting with ID: ${national_id}, User Found: ${!!user}`
    );

    if (!user || !user.password_hash) {
      throw new ApiError(401, 'بيانات الدخول غير صحيحة.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'بيانات الدخول غير صحيحة.');
    }

    const token = this.generateToken(user.id, user.role.name);

    // Clean up response
    const { password_hash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async updateProfile(userId: number, data: any): Promise<Partial<User>> {
    const { national_id, password } = data;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user) throw new ApiError(404, 'المستخدم غير موجود.');

    if (user.role?.name === 'student') {
      throw new ApiError(403, 'لا يمكن للطالب تعديل بيانات الحساب.');
    }

    if (national_id && national_id !== user.national_id) {
      const existing = await this.userRepository.findOne({
        where: { national_id }
      });
      if (existing)
        throw new ApiError(400, 'الرقم الهوية مسجل مسبقاً لمستخدم آخر.');
      user.national_id = national_id;
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password, salt);
    }

    const savedUser = await this.userRepository.save(user);
    const { password_hash: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  private generateToken(id: number, role: string): string {
    return jwt.sign(
      { id, role },
      process.env.JWT_SECRET || 'sems_super_secret_key_change_in_production',
      { expiresIn: '7d' } as jwt.SignOptions
    );
  }
}
