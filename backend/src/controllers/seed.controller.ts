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

          // Auto-detect header row: some Excel files have the header on a row other than the first
          const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const knownHeaders = ['السؤال', 'question', 'question_text', 'قائمة الأسئلة'];
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
            const row = rawRows[i];
            if (row && row.some((cell: any) => knownHeaders.includes(String(cell || '').trim()))) {
              headerRowIndex = i;
              break;
            }
          }

          // Re-parse with correct header row
          let data: any[];
          if (headerRowIndex > 0) {
            // Build data using detected header row as column names
            const headers = rawRows[headerRowIndex].map((h: any) => String(h || '').trim());
            data = [];
            for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
              const obj: any = {};
              rawRows[i].forEach((cell: any, idx: number) => {
                if (idx < headers.length && headers[idx]) {
                  obj[headers[idx]] = cell;
                }
              });
              data.push(obj);
            }
            logs.push(`  [${examName}] Header detected at row ${headerRowIndex + 1} (shifted)`);
          } else {
            data = XLSX.utils.sheet_to_json(sheet);
          }

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

/**
 * Safe, targeted fix for Model 4 (Math + Biology).
 * - Finds existing exams by name pattern
 * - Clears broken questions (0 questions / wrong import)
 * - Imports correct questions from hardcoded data
 * - Deletes old 0/0 results so students can retake
 * - Does NOT touch any other exams, students, or data
 */
export const fixModel4 = async (req: Request, res: Response) => {
  try {
    const examRepo = AppDataSource.getRepository(ExamModel);
    const questionRepo = AppDataSource.getRepository(Question);
    const answerRepo = AppDataSource.getRepository(Answer);
    const logs: string[] = [];

    // Hardcoded questions extracted from Excel files
    const model4Data: Record<string, { q: string; choices: string[]; ci: number }[]> = {
      'رياضيات نموذج4': [
        { q: 'النقاط الحرجة لــx³-3x²+2', choices: ['X=0,2', 'X=1,3', 'X=0,1', 'X=2,3'], ci: 0 },
        { q: 'حل: e^(2x) - 3e^x + 2 = 0', choices: ['0', 'ln(2)', 'ln(1) و ln(2)', '0 و ln(2)'], ci: 3 },
        { q: '∫ x*e^x dx =', choices: ['e^x', '(x-1)e^x + c', 'x*e^x', 'e^x/x'], ci: 1 },
        { q: 'lim(x→∞) (3x²+2x)/(x²+1) =', choices: ['0', '2', '3', '∞'], ci: 2 },
        { q: 'حل: 2x+y=7, x²+y²=10', choices: ['(3,1) و (1,5)', '(2,3) و (3,1)', '(1,5) و (2,3)', '(0,7) و (3,1)'], ci: 0 },
        { q: 'المشتقة العكسية لـ 1/x =', choices: ['1/x²', 'ln|x| + c', '-1/x²', 'x'], ci: 1 },
        { q: 'إذا z = 3 + 4i فإن |z| =', choices: ['5', '7', '3', '4'], ci: 0 },
        { q: 'حل: cos(2x) = 1/2', choices: ['30°', '45°', '60°', '120°'], ci: 2 },
        { q: 'المتسلسلة 1+1/2+1/4+... =', choices: ['1', '1.5', '2', '3'], ci: 2 },
        { q: 'lim(x→0) sin(x)/x =', choices: ['0', '1', '∞', '-1'], ci: 1 },
        { q: 'حل: x² - 5x + 6 > 0', choices: ['x < 2 أو x > 3', '2 < x < 3', 'x < 3', 'x > 2'], ci: 0 },
        { q: 'إذا ∫f(x)dx = x²+c فإن f(x) =', choices: ['2x', 'x', 'x³/3', '2'], ci: 0 },
        { q: 'جذور x⁴ - 1 = 0', choices: ['1 فقط', '±1', '1، -1، i، -i', '2 فقط'], ci: 2 },
        { q: 'مجموع n حد حسابية:', choices: ['n(2a+d)/2', 'n(2a+(n-1)d)/2', 'n*a', 'n*d'], ci: 1 },
        { q: 'حل: tan(x) = √3', choices: ['30°', '45°', '60°', '90°'], ci: 2 },
      ],
      'أحياء نموذج 4': [
        { q: 'التكاثر اللاجنسي ينتج:', choices: ['أفراد متشابهة وراثياً', 'أفراد متنوعون', 'أفراد أقوى', 'أفراد أضعف'], ci: 0 },
        { q: 'التكاثر الجنسي ينتج:', choices: ['نسخ متطابقة', 'تنوع وراثي', 'عدد أقل من الأفراد', 'أفراد بدون جينات'], ci: 1 },
        { q: 'الإخصاب هو اتحاد:', choices: ['خليتين جسديتين', 'نوى فقط', 'حيوان منوي وبويضة', 'خليتين دموية'], ci: 2 },
        { q: 'الحمل عند الإنسان يستمر تقريباً:', choices: ['3 أشهر', '6 أشهر', '9 أشهر', 'سنة'], ci: 2 },
        { q: 'المشيمة وظيفتها:', choices: ['تغذي الجنين فقط', 'تنقل المغذيات والأكسجين من الأم للجنين', 'تنتج الحليب', 'تفرز الفضلات'], ci: 1 },
        { q: 'تبادل الغازات في:', choices: ['الشعب', 'الحجاب', 'القصبة', 'الحويصلات'], ci: 3 },
        { q: 'الحليب يحتوي على:', choices: ['الماء فقط', 'البروتينات والدهون والكالسيوم والفيتامينات', 'السكريات فقط', 'الملح فقط'], ci: 1 },
        { q: 'سن البلوغ ينطوي على:', choices: ['تغييرات جسدية وهرمونية', 'توقف النمو', 'فقدان الذاكرة', 'نقص الوزن'], ci: 0 },
        { q: 'الشيخوخة عملية:', choices: ['سريعة جداً', 'تدريجية تنطوي على انخفاض الوظائف', 'لا تحدث', 'تحدث فقط عند المرض'], ci: 1 },
        { q: 'التغذية السليمة تتطلب:', choices: ['الكربوهيدرات فقط', 'البروتينات والدهون والفيتامينات والمعادن والماء', 'الملح فقط', 'السكريات المكررة'], ci: 1 },
        { q: 'نقص الكالسيوم يسبب:', choices: ['ضعف الأسنان والعظام', 'السمنة', 'قصر القامة فقط', 'ضعف البصر'], ci: 0 },
        { q: 'الفيتامين A ضروري لـ:', choices: ['العضلات فقط', 'البصر والجلد والمناعة', 'الأسنان فقط', 'الشعر فقط'], ci: 1 },
        { q: 'الرياضة والنشاط البدني يقويان:', choices: ['الحزن', 'الخوف', 'الصحة والقلب والعضلات', 'المرض'], ci: 2 },
        { q: 'النوم الكافي ضروري لـ:', choices: ['الإرهاق فقط', 'الترميم والتعافي والنمو والذاكرة', 'وقت العمل', 'إهدار الوقت'], ci: 1 },
        { q: 'التدخين يؤثر بشكل أساسي على:', choices: ['الكلى فقط', 'الكبد فقط', 'الرئتين والقلب والصحة العامة', 'المعدة فقط'], ci: 2 },
      ],
    };

    for (const [examName, questions] of Object.entries(model4Data)) {
      // Find the exam by name (flexible matching)
      const allExams = await examRepo.find({ relations: ['subject'] });
      const exam = allExams.find((e) =>
        e.name.replace(/\s+/g, '').includes(examName.replace(/\s+/g, ''))
      );

      if (!exam) {
        logs.push(`❌ Exam "${examName}" not found in database - skipping`);
        continue;
      }

      logs.push(`Found exam: "${exam.name}" (ID: ${exam.id})`);

      // Delete old broken questions + answers
      const oldQuestions = await questionRepo.find({ where: { exam: { id: exam.id } } });
      if (oldQuestions.length > 0) {
        await answerRepo
          .createQueryBuilder()
          .delete()
          .where('question_id IN (SELECT id FROM questions WHERE exam_model_id = :examId)', { examId: exam.id })
          .execute();
        await questionRepo.delete({ exam: { id: exam.id } });
        logs.push(`  Cleared ${oldQuestions.length} old questions`);
      }

      // Delete old 0/0 results so students can retake
      const { affected } = await AppDataSource.getRepository('Result')
        .createQueryBuilder()
        .delete()
        .where('exam_model_id = :examId AND total_questions = 0', { examId: exam.id })
        .execute();
      if (affected) logs.push(`  Deleted ${affected} broken 0/0 results`);

      // Import correct questions
      for (const item of questions) {
        const question = await questionRepo.save({
          question_text: item.q,
          exam: exam,
          sort_order: 0,
        });

        const answers = item.choices.map((text, idx) => ({
          answer_text: text,
          is_correct: idx === item.ci,
          sort_order: idx,
          question: question,
        }));
        await answerRepo.save(answers);
      }
      logs.push(`  ✅ Imported ${questions.length} questions successfully`);
    }

    res.json({ message: 'Model 4 fix completed', logs });
  } catch (error: any) {
    console.error('Fix Model 4 error:', error);
    res.status(500).json({ error: 'Failed to fix Model 4', details: error.message });
  }
};
