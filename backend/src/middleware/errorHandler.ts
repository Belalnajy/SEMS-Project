import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // TypeORM Duplicate Key Error
  if (err.code === '23505') {
    return res.status(409).json({ error: 'السجل موجود مسبقاً. قيمة مكررة.' });
  }

  // TypeORM Foreign Key Error
  if (err.code === '23503') {
    return res
      .status(400)
      .json({ error: 'مرجع غير صالح. السجل المرتبط غير موجود.' });
  }

  console.error(err);
  res.status(500).json({ error: 'حدث خطأ غير متوقع في الخادم.' });
};
