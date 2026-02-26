import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { ApiError } from './errorHandler';

interface JwtPayload {
  id: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      throw new ApiError(401, 'لم يتم تقديم رمز المصادقة (Token).');
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'sems_super_secret_key_change_in_production',
    ) as JwtPayload;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.id },
      relations: ['role', 'student', 'student.section'],
    });

    if (!user) {
      throw new ApiError(401, 'المستخدم غير موجود.');
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Error:', error.message);
    next(new ApiError(401, 'رمز المصادقة غير صالح أو منتهي الصلاحية.'));
  }
};
