import { AppDataSource } from '../src/config/data-source';
import { Role } from '../src/entities/Role';
import { User } from '../src/entities/User';
import { Subject } from '../src/entities/Subject';
import { Section } from '../src/entities/Section';
import { Student } from '../src/entities/Student';
import bcrypt from 'bcryptjs';

const seed = async () => {
  await AppDataSource.initialize();
  console.log('🔄 Connected to sync/seed Data...');

  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const subjectRepo = AppDataSource.getRepository(Subject);
  const sectionRepo = AppDataSource.getRepository(Section);
  const studentRepo = AppDataSource.getRepository(Student);

  // 1. Clear database slightly based on how synchronize works, but here we just upsert

  // 2. Roles
  const roles = ['supervisor', 'manager', 'student', 'guest'];
  for (const r of roles) {
    const exists = await roleRepo.findOne({ where: { name: r } });
    if (!exists) await roleRepo.save({ name: r });
  }

  // 3. Subjects
  const subjects = ['اللغة العربية', 'الرياضيات', 'العلوم', 'التاريخ'];
  for (const s of subjects) {
    const exists = await subjectRepo.findOne({ where: { name: s } });
    if (!exists) await subjectRepo.save({ name: s, description: `منهج ${s}` });
  }

  // 4. Sections
  const sections = ['شعبة أ', 'شعبة ب', 'شعبة جـ'];
  for (const s of sections) {
    const exists = await sectionRepo.findOne({ where: { name: s } });
    if (!exists) await sectionRepo.save({ name: s });
  }

  // 5. Default Supervisor User
  const supervisorRole = await roleRepo.findOne({
    where: { name: 'supervisor' },
  });
  if (supervisorRole) {
    // Delete any user that might conflict
    await userRepo.delete({ national_id: '1234567890' });
    await userRepo.delete({ username: 'admin' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);
    await userRepo.save({
      username: 'admin',
      national_id: '1234567890',
      email: 'supervisor@sems.com',
      password_hash: hash,
      role: supervisorRole,
    });
    console.log('✅ Supervisor user set: 1234567890 / 123456');
  }

  // 6. Default Manager User
  const managerRole = await roleRepo.findOne({
    where: { name: 'manager' },
  });
  if (managerRole) {
    await userRepo.delete({ national_id: '0987654321' });
    await userRepo.delete({ username: 'manager_admin' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);
    await userRepo.save({
      username: 'manager_admin',
      national_id: '0987654321',
      email: 'manager@sems.com',
      password_hash: hash,
      role: managerRole,
    });
    console.log('✅ Manager user set: 0987654321 / 123456');
  }

  // 7. Default Student User
  const studentRole = await roleRepo.findOne({
    where: { name: 'student' },
  });
  if (studentRole) {
    await userRepo.delete({ national_id: '1122334455' });
    await userRepo.delete({ username: 'STU999999' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);
    const savedUser = await userRepo.save({
      username: 'STU999999',
      national_id: '1122334455',
      email: 'student@sems.com',
      password_hash: hash,
      role: studentRole,
    });

    // Create their student profile
    const section = await sectionRepo.findOne({ where: { name: 'شعبة أ' } });
    await studentRepo.save({
      full_name: 'طالب تجريبي',
      student_number: 'STU999999',
      section: section || undefined,
      user: savedUser,
    });
    console.log('✅ Student user set: 1122334455 / 123456');
  }

  console.log('🎉 Seeding completed successfully.');
  process.exit(0);
};

seed().catch(console.error);
