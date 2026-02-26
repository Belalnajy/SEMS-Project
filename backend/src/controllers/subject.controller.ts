import { Request, Response } from 'express';
import { SubjectService } from '../services/subject.service';

const subjectService = new SubjectService();

export const getAllSubjects = async (req: Request, res: Response) => {
  const subjects = await subjectService.getAll();
  res.json(subjects);
};

export const getSubjectById = async (req: Request, res: Response) => {
  const subject = await subjectService.getById(Number(req.params.id));
  res.json(subject);
};

export const createSubject = async (req: Request, res: Response) => {
  const subject = await subjectService.create(req.body);
  res.status(201).json(subject);
};

export const updateSubject = async (req: Request, res: Response) => {
  const subject = await subjectService.update(Number(req.params.id), req.body);
  res.json(subject);
};

export const deleteSubject = async (req: Request, res: Response) => {
  await subjectService.delete(Number(req.params.id));
  res.json({ message: 'تم حذف المادة بنجاح.' });
};
