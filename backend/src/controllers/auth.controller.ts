import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
};

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.user) throw new Error('غير مصرح لك بالوصول');
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json({ message: 'تم تحديث البيانات بنجاح', user });
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'المستخدم غير موجود.' });
  }

  const { password_hash, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
};
