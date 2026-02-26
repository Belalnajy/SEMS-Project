import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Role } from '../entities/Role';
import { User } from '../entities/User';
import { Subject } from '../entities/Subject';
import { Section } from '../entities/Section';
import { Student } from '../entities/Student';
import bcrypt from 'bcryptjs';

export const seedDatabase = async (req: Request, res: Response) => {
  try {
    // Check if seeding is already done or protect with a simple query param if needed
    // For now, it will upsert/re-create the demo users

    const roleRepo = AppDataSource.getRepository(Role);
    const userRepo = AppDataSource.getRepository(User);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const sectionRepo = AppDataSource.getRepository(Section);
    const studentRepo = AppDataSource.getRepository(Student);

    const logs: string[] = [];

    // 1. Roles
    const roles = ['supervisor', 'manager', 'student', 'guest'];
    for (const r of roles) {
      const exists = await roleRepo.findOne({ where: { name: r } });
      if (!exists) await roleRepo.save({ name: r });
    }
    logs.push('Roles initialized');

    // 2. Subjects
    const subjects = ['اللغة العربية', 'الرياضيات', 'العلوم', 'التاريخ'];
    for (const s of subjects) {
      const exists = await subjectRepo.findOne({ where: { name: s } });
      if (!exists)
        await subjectRepo.save({ name: s, description: `منهج ${s}` });
    }
    logs.push('Subjects initialized');

    // 3. Sections
    const sections = ['شعبة أ', 'شعبة ب', 'شعبة جـ'];
    for (const s of sections) {
      const exists = await sectionRepo.findOne({ where: { name: s } });
      if (!exists) await sectionRepo.save({ name: s });
    }
    logs.push('Sections initialized');

    // 4. Supervisor
    const supervisorRole = await roleRepo.findOne({
      where: { name: 'supervisor' },
    });
    if (supervisorRole) {
      await userRepo.delete({ username: 'admin' });
      const hash = await bcrypt.hash('123456', 10);
      await userRepo.save({
        username: 'admin',
        national_id: '1234567890',
        email: 'supervisor@sems.com',
        password_hash: hash,
        role: supervisorRole,
      });
      logs.push('Supervisor set: 1234567890 / 123456');
    }

    // 5. Manager
    const managerRole = await roleRepo.findOne({ where: { name: 'manager' } });
    if (managerRole) {
      await userRepo.delete({ username: 'manager_admin' });
      const hash = await bcrypt.hash('123456', 10);
      await userRepo.save({
        username: 'manager_admin',
        national_id: '0987654321',
        email: 'manager@sems.com',
        password_hash: hash,
        role: managerRole,
      });
      logs.push('Manager set: 0987654321 / 123456');
    }

    // 6. Student
    const studentRole = await roleRepo.findOne({ where: { name: 'student' } });
    if (studentRole) {
      await userRepo.delete({ national_id: '1122334455' });
      const hash = await bcrypt.hash('123456', 10);
      const savedUser = await userRepo.save({
        username: 'STU999999',
        national_id: '1122334455',
        email: 'student@sems.com',
        password_hash: hash,
        role: studentRole,
      });

      const section = await sectionRepo.findOne({ where: { name: 'شعبة أ' } });
      await studentRepo.delete({ student_number: 'STU999999' });
      await studentRepo.save({
        full_name: 'طالب تجريبي',
        student_number: 'STU999999',
        section: section || undefined,
        user: savedUser,
      });
      logs.push('Student set: 1122334455 / 123456');
    }

    res.json({ message: 'Seeding completed successfully', logs });
  } catch (error: any) {
    console.error('Seed error:', error);
    res
      .status(500)
      .json({ error: 'Failed to seed database', details: error.message });
  }
};
