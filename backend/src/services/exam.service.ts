import * as XLSX from 'xlsx';
import { AppDataSource } from '../config/data-source';
import { ExamModel } from '../entities/ExamModel';
import { Subject } from '../entities/Subject';
import { Question } from '../entities/Question';
import { Answer } from '../entities/Answer';
import { Result } from '../entities/Result';
import { Student } from '../entities/Student';
import { QuestionReport } from '../entities/QuestionReport';
import { ApiError } from '../middleware/errorHandler';

export class ExamService {
  private examRepository = AppDataSource.getRepository(ExamModel);
  private subjectRepository = AppDataSource.getRepository(Subject);
  private questionRepository = AppDataSource.getRepository(Question);
  private resultRepository = AppDataSource.getRepository(Result);
  private studentRepository = AppDataSource.getRepository(Student);
  private reportRepository = AppDataSource.getRepository(QuestionReport);

  async getAll() {
    return await this.examRepository.find({
      relations: ['subject'],
      order: { id: 'DESC' },
    });
  }

  async getById(id: number) {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: ['subject', 'questions', 'questions.answers'],
    });

    if (!exam) throw new ApiError(404, 'النموذج غير موجود.');

    // Sort questions and answers
    if (exam.questions) {
      exam.questions.sort((a, b) => a.sort_order - b.sort_order);
      exam.questions.forEach((q) => {
        if (q.answers) q.answers.sort((a, b) => a.sort_order - b.sort_order);
      });
    }

    return exam;
  }

  async create(data: any) {
    const { subject_id, name, duration_minutes, allow_reattempt, is_active } =
      data;

    const subject = await this.subjectRepository.findOne({
      where: { id: subject_id },
    });
    if (!subject) throw new ApiError(400, 'المادة غير موجودة.');

    const exam = new ExamModel();
    exam.subject = subject;
    exam.name = name;
    exam.duration_minutes = duration_minutes || 30;
    exam.allow_reattempt = allow_reattempt || false;
    exam.is_active = is_active !== undefined ? is_active : true;

    return await this.examRepository.save(exam);
  }

  async update(id: number, data: any) {
    const exam = await this.getById(id);
    const { subject_id, name, duration_minutes, allow_reattempt, is_active } =
      data;

    if (subject_id) {
      const subject = await this.subjectRepository.findOne({
        where: { id: subject_id },
      });
      if (!subject) throw new ApiError(400, 'المادة غير موجودة.');
      exam.subject = subject;
    }

    if (name !== undefined) exam.name = name;
    if (duration_minutes !== undefined)
      exam.duration_minutes = duration_minutes;
    if (allow_reattempt !== undefined) exam.allow_reattempt = allow_reattempt;
    if (is_active !== undefined) exam.is_active = is_active;

    return await this.examRepository.save(exam);
  }

  async delete(id: number) {
    const exam = await this.getById(id);
    return await this.examRepository.remove(exam);
  }

  // --- Questions Management ---
  async addQuestion(examId: number, data: any) {
    const exam = await this.getById(examId);
    const { question_text, answers } = data; // answers[]: { answer_text, is_correct }

    return await AppDataSource.transaction(async (manager) => {
      const question = new Question();
      question.exam = exam;
      question.question_text = question_text;

      const savedQuestion = await manager.save(Question, question);

      if (answers && Array.isArray(answers)) {
        const answerEntities = answers.map((a: any, idx: number) => {
          const ans = new Answer();
          ans.question = savedQuestion;
          ans.answer_text = a.answer_text;
          ans.is_correct = a.is_correct;
          ans.sort_order = idx;
          return ans;
        });
        await manager.save(Answer, answerEntities);
      }

      return await manager.findOne(Question, {
        where: { id: savedQuestion.id },
        relations: ['answers'],
      });
    });
  }

  async deleteQuestion(examId: number, questionId: number) {
    const question = await this.questionRepository.findOne({
      where: { id: questionId, exam: { id: examId } },
    });

    if (!question) throw new ApiError(404, 'السؤال غير موجود في هذا النموذج.');

    return await this.questionRepository.remove(question);
  }

  async checkAttemptEligibility(examId: number, userId: number) {
    const exam = await this.getById(examId);
    if (exam.allow_reattempt) return true;

    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) return true; // Let them try if student profile missing (submit will catch later anyway)

    const existing = await this.resultRepository.findOne({
      where: { exam_model: { id: exam.id }, student: { id: student.id } },
    });

    if (existing) {
      throw new ApiError(403, 'غير مسموح بإعادة هذا الامتحان.');
    }

    return true;
  }

  // --- Exam Attempt ---
  async submitExam(
    examId: number,
    userId: number,
    data: { answers: any[]; started_at?: string },
  ) {
    const { answers, started_at } = data;
    const exam = await this.getById(examId);

    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!student) throw new ApiError(400, 'بيانات الطالب غير موجودة.');

    // Enforce reattempt policy
    if (!exam.allow_reattempt) {
      const existing = await this.resultRepository.findOne({
        where: { exam_model: { id: exam.id }, student: { id: student.id } },
      });
      if (existing) {
        throw new ApiError(403, 'غير مسموح بإعادة هذا الامتحان.');
      }
    }

    let score = 0;
    const totalQuestions = exam.questions?.length || 0;

    if (exam.questions) {
      exam.questions.forEach((q) => {
        const submitted = answers.find((a) => a.question_id === q.id);
        const correctAnswer = q.answers?.find((a) => a.is_correct);

        if (
          submitted &&
          correctAnswer &&
          submitted.answer_id === correctAnswer.id
        ) {
          score++;
        }
      });
    }

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const result = new Result();
    result.exam_model = exam;
    result.student = student;
    result.score = score;
    result.total_questions = totalQuestions;
    result.percentage = percentage;
    result.started_at = started_at ? new Date(started_at) : new Date();
    result.completed_at = new Date();

    return await this.resultRepository.save(result);
  }

  async submitGuestExam(
    examId: number,
    data: { answers: any[]; guest_name: string; started_at?: string },
  ) {
    const { answers, guest_name, started_at } = data;
    const exam = await this.getById(examId);

    let score = 0;
    const totalQuestions = exam.questions?.length || 0;

    if (exam.questions) {
      exam.questions.forEach((q) => {
        const submitted = answers.find((a) => a.question_id === q.id);
        const correctAnswer = q.answers?.find((a) => a.is_correct);

        if (
          submitted &&
          correctAnswer &&
          submitted.answer_id === correctAnswer.id
        ) {
          score++;
        }
      });
    }

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const result = new Result();
    result.exam_model = exam;
    result.is_guest = true;
    result.guest_name = guest_name;
    result.score = score;
    result.total_questions = totalQuestions;
    result.percentage = percentage;
    result.started_at = started_at ? new Date(started_at) : new Date();
    result.completed_at = new Date();

    return await this.resultRepository.save(result);
  }

  async updateQuestion(examId: number, questionId: number, data: any) {
    const { question_text, answers } = data;

    const question = await this.questionRepository.findOne({
      where: { id: questionId, exam: { id: examId } },
      relations: ['answers'],
    });

    if (!question) throw new ApiError(404, 'السؤال غير موجود.');

    return await AppDataSource.transaction(async (manager) => {
      // Update question text
      question.question_text = question_text;
      const updatedQuestion = await manager.save(Question, question);

      if (answers && Array.isArray(answers)) {
        // Delete existing answers
        await manager.delete(Answer, { question: { id: questionId } });

        // Insert new answers
        const answerEntities = answers.map((a: any, idx: number) => {
          const ans = new Answer();
          ans.question = updatedQuestion;
          ans.answer_text = a.answer_text;
          ans.is_correct = a.is_correct;
          ans.sort_order = idx;
          return ans;
        });
        await manager.save(Answer, answerEntities);
      }

      return await manager.findOne(Question, {
        where: { id: updatedQuestion.id },
        relations: ['answers'],
      });
    });
  }

  async getMyResults(userId: number) {
    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!student) return [];

    const results = await this.resultRepository.find({
      where: { student: { id: student.id } },
      relations: ['exam_model', 'exam_model.subject'],
      order: { completed_at: 'DESC' },
    });

    return results.map((r) => ({
      id: r.id,
      exam_id: r.exam_model.id,
      exam_name: r.exam_model.name,
      subject_name: (r.exam_model.subject as any)?.name,
      score: r.score,
      total_questions: r.total_questions,
      percentage: r.percentage,
      completed_at: r.completed_at,
    }));
  }


  async reportQuestion(
    examId: number,
    questionId: number,
    userId: number,
    data: { message?: string },
  ) {
    const exam = await this.getById(examId);
    const question = exam.questions?.find((q) => q.id === questionId);

    if (!question) {
      throw new ApiError(404, 'السؤال غير موجود في هذا النموذج.');
    }

    const student = await this.studentRepository.findOne({
      where: { user: { id: userId } },
    });

    const report = new QuestionReport();
    report.exam = exam;
    report.question = question;
    report.student = student || null;
    report.message = (data.message || '').trim() || 'تم الإبلاغ عن خطأ في السؤال.';
    report.status = 'pending';

    await this.reportRepository.save(report);
    return { success: true };
  }

  async importQuestionsFromExcel(examId: number, buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    const exam = await this.getById(examId);

    return await AppDataSource.transaction(async (manager) => {
      for (const row of data) {
        // Expected columns: question_text, answer1, answer2, answer3, answer4, correct_answer (1-4)
        // Supported New Format: السؤال, A, B, C, D, الإجابة الصحيحه
        const questionText =
          row.question_text || row.question || row['السؤال'] || row['question'];

        const rawChoices = [
          row.answer1 || row.it1 || row['A'] || row['a'],
          row.answer2 || row.it2 || row['B'] || row['b'],
          row.answer3 || row.it3 || row['C'] || row['c'],
          row.answer4 || row.it4 || row['D'] || row['d'],
        ];

        const choices = rawChoices
          .map((value) => (value === undefined || value === null ? '' : String(value).trim()))
          .filter((value) => value !== '' && value !== '0');

        const correctRaw = String(
          row.correct_answer ||
            row.correct ||
            row['الإجابة الصحيحه'] ||
            row['الإجابة الصحيحة'] ||
            '',
        );
        let correctIndex = -1;

        // Map A,B,C,D or 1,2,3,4
        const upperCorrect = correctRaw.trim().toUpperCase();
        if (['A', '1', 'أ'].includes(upperCorrect)) correctIndex = 0;
        else if (['B', '2', 'ب'].includes(upperCorrect)) correctIndex = 1;
        else if (['C', '3', 'ج'].includes(upperCorrect)) correctIndex = 2;
        else if (['D', '4', 'د'].includes(upperCorrect)) correctIndex = 3;
        else {
          // Fallback to numeric
          const num = parseInt(upperCorrect);
          if (!isNaN(num)) correctIndex = num - 1;
        }

        if (!questionText || choices.length < 2) continue;

        const question = new Question();
        question.exam = exam;
        question.question_text = String(questionText);
        const savedQ = await manager.save(Question, question);

        const answerEntities = choices.map((text, idx) => {
          const ans = new Answer();
          ans.question = savedQ;
          ans.answer_text = String(text);
          ans.is_correct = idx === correctIndex;
          ans.sort_order = idx;
          return ans;
        });
        await manager.save(Answer, answerEntities);
      }
      return { success: true };
    });
  }
}
