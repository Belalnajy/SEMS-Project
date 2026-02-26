import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';

const studentService = new StudentService();

export const getAllStudents = async (req: Request, res: Response) => {
  const data = await studentService.getAll(req.query);
  res.json(data);
};

export const getStudentById = async (req: Request, res: Response) => {
  const student = await studentService.getById(Number(req.params.id));
  res.json(student);
};

export const createStudent = async (req: Request, res: Response) => {
  const student = await studentService.create(req.body);
  res.status(201).json(student);
};

export const updateStudent = async (req: Request, res: Response) => {
  const student = await studentService.update(Number(req.params.id), req.body);
  res.json(student);
};

export const deleteStudent = async (req: Request, res: Response) => {
  await studentService.delete(Number(req.params.id));
  res.json({ message: 'تم حذف الطالب بنجاح.' });
};

export const importStudents = async (req: Request, res: Response) => {
  const file = (req as any).file;
  if (!file) throw new Error('يرجى اختيار ملف Excel');
  const sectionId = req.body.section_id
    ? Number(req.body.section_id)
    : undefined;
  const result = await studentService.importFromExcel(file.buffer, sectionId);
  res.json(result);
};
