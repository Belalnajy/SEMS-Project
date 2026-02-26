import { Request, Response } from 'express';
import { SectionService } from '../services/section.service';

const sectionService = new SectionService();

export const getAllSections = async (req: Request, res: Response) => {
  const sections = await sectionService.getAll();
  res.json(sections);
};

export const getSectionById = async (req: Request, res: Response) => {
  const section = await sectionService.getById(Number(req.params.id));
  res.json(section);
};

export const createSection = async (req: Request, res: Response) => {
  const section = await sectionService.create(req.body);
  res.status(201).json(section);
};

export const updateSection = async (req: Request, res: Response) => {
  const section = await sectionService.update(Number(req.params.id), req.body);
  res.json(section);
};

export const deleteSection = async (req: Request, res: Response) => {
  await sectionService.delete(Number(req.params.id));
  res.json({ message: 'تم حذف الشعبة بنجاح.' });
};
