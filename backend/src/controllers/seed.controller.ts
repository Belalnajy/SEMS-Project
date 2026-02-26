import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Role } from '../entities/Role';
import { User } from '../entities/User';
import { Subject } from '../entities/Subject';
import { Section } from '../entities/Section';
import { Student } from '../entities/Student';
import { ExamModel } from '../entities/ExamModel';
import { Question } from '../entities/Question';
import { Answer } from '../entities/Answer';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

export const seedDatabase = async (req: Request, res: Response) => {
  try {
    // Check if seeding is already done or protect with a simple query param if needed
    // For now, it will upsert/re-create the demo users

    const roleRepo = AppDataSource.getRepository(Role);
    const userRepo = AppDataSource.getRepository(User);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const sectionRepo = AppDataSource.getRepository(Section);
    const studentRepo = AppDataSource.getRepository(Student);
    const examRepo = AppDataSource.getRepository(ExamModel);

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

    // 7. Bulk Import from /questions directory
    const possiblePaths = [
      path.join(process.cwd(), '../questions'), // If running from backend folder
      path.join(process.cwd(), 'questions'), // If running from root
      path.join(__dirname, '../../questions'), // Relative to controller
      path.join(__dirname, '../../../questions'), // Relative to dist/api
    ];

    let QUESTIONS_DIR = '';
    for (const p of possiblePaths) {
      console.log(`[Seed] Checking for questions dir at: ${p}`);
      if (fs.existsSync(p)) {
        QUESTIONS_DIR = p;
        break;
      }
    }

    if (QUESTIONS_DIR) {
      logs.push(`Found questions directory at: ${QUESTIONS_DIR}`);
      const folders = fs.readdirSync(QUESTIONS_DIR);

      for (const folderName of folders) {
        const folderPath = path.join(QUESTIONS_DIR, folderName);
        if (!fs.statSync(folderPath).isDirectory()) continue;

        logs.push(`Processing folder: ${folderName}`);

        let subject = await subjectRepo.findOne({
          where: { name: folderName },
        });
        if (!subject) {
          subject = await subjectRepo.save({
            name: folderName,
            description: `منهج ${folderName}`,
          });
          logs.push(`Created new subject: ${folderName}`);
        } else {
          logs.push(`Using existing subject: ${folderName}`);
        }

        const files = fs
          .readdirSync(folderPath)
          .filter((f) => f.endsWith('.xlsx'));
        logs.push(`Found ${files.length} Excel files in ${folderName}`);

        for (const fileName of files) {
          const filePath = path.join(folderPath, fileName);
          const examName = fileName.replace('.xlsx', '');

          let exam = await examRepo.findOne({
            where: { name: examName, subject: { id: subject.id } },
            relations: ['subject'],
          });

          if (!exam) {
            exam = await examRepo.save({
              name: examName,
              subject: subject,
              duration_minutes: 30,
              is_active: true,
            });
            logs.push(`Created new exam model: ${examName}`);
          } else {
            logs.push(`Updating existing exam: ${examName}`);
            // Clear existing questions to avoid duplicates
            await AppDataSource.getRepository(Answer)
              .createQueryBuilder()
              .delete()
              .where(
                'question_id IN (SELECT id FROM questions WHERE exam_model_id = :examId)',
                { examId: exam.id },
              )
              .execute();
            await AppDataSource.getRepository(Question).delete({
              exam: { id: exam.id },
            });
          }

          const workbook = XLSX.read(fs.readFileSync(filePath), {
            type: 'buffer',
          });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const data: any[] = XLSX.utils.sheet_to_json(sheet);

          let questionCount = 0;
          for (const row of data) {
            const qText =
              row.question_text ||
              row.question ||
              row['قائمة الأسئلة'] ||
              row['السؤال'] ||
              row['السؤال '];
            const a1 =
              row.answer1 ||
              row.it1 ||
              row['الاختيار الأول'] ||
              row['أ'] ||
              row['A'];
            const a2 =
              row.answer2 ||
              row.it2 ||
              row['الاختيار الثاني'] ||
              row['ب'] ||
              row['B'];
            const a3 =
              row.answer3 ||
              row.it3 ||
              row['الاختيار الثالث'] ||
              row['ج'] ||
              row['C'];
            const a4 =
              row.answer4 ||
              row.it4 ||
              row['الاختيار الرابع'] ||
              row['د'] ||
              row['D'];
            const correctStr = String(
              row.correct_answer ||
                row.correct ||
                row['الإجابة الصحيحة'] ||
                row['الإجابة'] ||
                row['الإجابة الصحيحه'] ||
                row['الاجابة الصحيحة'] ||
                '',
            )
              .trim()
              .toUpperCase();

            if (!qText || !a1) continue;

            let correctIndex = -1;
            if (['1', 'أ', 'A'].includes(correctStr)) correctIndex = 0;
            else if (['2', 'ب', 'B'].includes(correctStr)) correctIndex = 1;
            else if (['3', 'ج', 'C'].includes(correctStr)) correctIndex = 2;
            else if (['4', 'د', 'D'].includes(correctStr)) correctIndex = 3;
            else {
              const num = parseInt(correctStr);
              if (!isNaN(num)) correctIndex = num - 1;
            }

            const choices = [a1, a2, a3, a4].filter(Boolean);
            const question = await AppDataSource.getRepository(Question).save({
              question_text: String(qText),
              exam: exam!,
              sort_order: 0,
            });

            const answers = choices.map((text, idx) => ({
              answer_text: String(text),
              is_correct: idx === correctIndex,
              sort_order: idx,
              question: question,
            }));
            await AppDataSource.getRepository(Answer).save(answers);
            questionCount++;
          }
          logs.push(
            `Successfully imported ${questionCount} questions for exam: ${examName}`,
          );
        }
      }
    } else {
      logs.push(
        '❌ Error: Could not find "questions" directory in any of the expected locations.',
      );
    }

    res.json({ message: 'Seeding completed successfully', logs });
  } catch (error: any) {
    console.error('Seed error:', error);
    res
      .status(500)
      .json({ error: 'Failed to seed database', details: error.message });
  }
};
