import { Request, Response } from 'express';
import { ExamService } from '../services/exam.service';

const examService = new ExamService();

export const getAllExams = async (req: Request, res: Response) => {
  const exams = await examService.getAll();
  // Guests only see active exams
  res.json(exams.filter((e) => e.is_active));
};

export const startExam = async (req: Request, res: Response) => {
  const exam = await examService.getById(Number(req.params.id));

  if (!exam.is_active) {
    return res.status(403).json({ error: 'هذا الامتحان غير متاح حالياً' });
  }

  // Hide correct answers for guests
  if (exam.questions) {
    exam.questions.forEach((q) => {
      if (q.answers) {
        q.answers.forEach((a: any) => {
          delete a.is_correct;
        });
      }
    });
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
  const result = await examService.submitGuestExam(
    Number(req.params.id),
    req.body,
  );
  res.status(201).json({ result });
};
