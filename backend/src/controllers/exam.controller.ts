import { Request, Response } from 'express';
import { ExamService } from '../services/exam.service';

const examService = new ExamService();

export const getAllExams = async (req: Request, res: Response) => {
  const exams = await examService.getAll();
  res.json(exams);
};

export const getExamQuestions = async (req: Request, res: Response) => {
  const exam = await examService.getById(Number(req.params.id));
  res.json(exam.questions || []);
};

export const getMyResults = async (req: Request, res: Response) => {
  const results = await examService.getMyResults(req.user!.id);
  res.json(results);
};

export const getExamById = async (req: Request, res: Response) => {
  const exam = await examService.getById(Number(req.params.id));

  // Exclude correct_answer markers if user is a student
  if (req.user?.role?.name === 'student') {
    if (exam.questions) {
      exam.questions.forEach((q) => {
        if (q.answers) {
          q.answers.forEach((a: any) => {
            delete a.is_correct;
          });
        }
      });
    }
  }

  res.json(exam);
};

export const createExam = async (req: Request, res: Response) => {
  const exam = await examService.create(req.body);
  res.status(201).json(exam);
};

export const updateExam = async (req: Request, res: Response) => {
  const exam = await examService.update(Number(req.params.id), req.body);
  res.json(exam);
};

export const deleteExam = async (req: Request, res: Response) => {
  await examService.delete(Number(req.params.id));
  res.json({ message: 'تم حذف النموذج بنجاح.' });
};

export const addQuestion = async (req: Request, res: Response) => {
  const question = await examService.addQuestion(
    Number(req.params.id),
    req.body,
  );
  res.status(201).json(question);
};

export const deleteQuestion = async (req: Request, res: Response) => {
  await examService.deleteQuestion(
    Number(req.params.id),
    Number(req.params.questionId),
  );
  res.json({ message: 'تم حذف السؤال بنجاح.' });
};

export const updateQuestion = async (req: Request, res: Response) => {
  const question = await examService.updateQuestion(
    Number(req.params.id),
    Number(req.params.questionId),
    req.body,
  );
  res.json({ question });
};

export const startExam = async (req: Request, res: Response) => {
  if (req.user?.role?.name === 'student') {
    await examService.checkAttemptEligibility(
      Number(req.params.id),
      req.user.id,
    );
  }

  const exam = await examService.getById(Number(req.params.id));

  // Exclude correct_answer markers for students
  if (req.user?.role?.name === 'student') {
    if (exam.questions) {
      exam.questions.forEach((q) => {
        if (q.answers) {
          q.answers.forEach((a: any) => {
            delete a.is_correct;
          });
        }
      });
    }
  }

  res.json({
    exam: {
      id: exam.id,
      name: exam.name,
      duration_minutes: exam.duration_minutes,
      subject_name: (exam.subject as any)?.name,
    },
    questions: exam.questions,
  });
};

export const submitExam = async (req: Request, res: Response) => {
  const result = await examService.submitExam(
    Number(req.params.id),
    req.user!.id,
    req.body,
  );
  res.status(201).json({ result });
};


export const reportQuestion = async (req: Request, res: Response) => {
  const result = await examService.reportQuestion(
    Number(req.params.id),
    Number(req.params.questionId),
    req.user!.id,
    req.body,
  );
  res.status(201).json(result);
};

export const importQuestions = async (req: Request, res: Response) => {
  const file = (req as any).file;
  if (!file) throw new Error('يرجى اختيار ملف Excel');
  const result = await examService.importQuestionsFromExcel(
    Number(req.params.id),
    file.buffer,
  );
  res.json(result);
};
