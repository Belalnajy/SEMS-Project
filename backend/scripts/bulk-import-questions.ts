import { AppDataSource } from '../src/config/data-source';
import { Subject } from '../src/entities/Subject';
import { ExamModel } from '../src/entities/ExamModel';
import { Question } from '../src/entities/Question';
import { Answer } from '../src/entities/Answer';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const QUESTIONS_DIR = '/home/belal/Documents/SEMS/questions';

const importExams = async () => {
  try {
    await AppDataSource.initialize();
    console.log('🔄 Connected to database for question import...');

    const subjectRepo = AppDataSource.getRepository(Subject);
    const examRepo = AppDataSource.getRepository(ExamModel);

    const folders = fs.readdirSync(QUESTIONS_DIR);

    for (const folderName of folders) {
      const folderPath = path.join(QUESTIONS_DIR, folderName);
      if (!fs.statSync(folderPath).isDirectory()) continue;

      console.log(`📂 Processing Subject: ${folderName}`);

      // Get or create Subject
      let subject = await subjectRepo.findOne({ where: { name: folderName } });
      if (!subject) {
        subject = subjectRepo.create({
          name: folderName,
          description: `منهج ${folderName}`,
        });
        subject = await subjectRepo.save(subject);
        console.log(`✅ Created Subject: ${folderName}`);
      }

      const files = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith('.xlsx'));

      for (const fileName of files) {
        const filePath = path.join(folderPath, fileName);
        const examName = fileName.replace('.xlsx', '');

        console.log(`   📄 Importing Exam: ${examName}`);

        // Create Exam Model
        let exam = await examRepo.findOne({
          where: { name: examName, subject: { id: subject.id } },
          relations: ['subject'],
        });

        if (!exam) {
          exam = examRepo.create({
            name: examName,
            subject: subject,
            duration_minutes: 30, // Default
            is_active: true,
          });
          exam = await examRepo.save(exam);
        } else {
          // Clear existing questions to avoid duplicates on re-run
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
          console.log(`   ♻️ Cleared existing questions for: ${examName}`);
        }

        // Read Excel
        const workbook = XLSX.read(fs.readFileSync(filePath), {
          type: 'buffer',
        });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(sheet);

        for (const row of data) {
          // Try to map columns flexibly
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

          // Determine correct index
          let correctIndex = -1;
          if (['1', 'أ', 'A'].includes(correctStr)) correctIndex = 0;
          else if (['2', 'ب', 'B'].includes(correctStr)) correctIndex = 1;
          else if (['3', 'ج', 'C'].includes(correctStr)) correctIndex = 2;
          else if (['4', 'د', 'D'].includes(correctStr)) correctIndex = 3;
          else {
            // Try fallback number parsing
            const num = parseInt(correctStr);
            if (!isNaN(num)) correctIndex = num - 1;
          }

          const choices = [a1, a2, a3, a4].filter(Boolean);

          await AppDataSource.transaction(async (manager) => {
            const question = manager.create(Question, {
              question_text: String(qText),
              exam: exam!,
              sort_order: 0,
            });
            const savedQ = await manager.save(Question, question);

            const answers = choices.map((text, idx) => {
              return manager.create(Answer, {
                answer_text: String(text),
                is_correct: idx === correctIndex,
                sort_order: idx,
                question: savedQ,
              });
            });
            await manager.save(Answer, answers);
          });
        }
      }
    }

    console.log('🎉 All questions imported successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
};

importExams();
