import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

// Simple validation wrapper since we're using raw validators originally
export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic required fields check for now, can be expanded to Zod/Joi later
    const missingFields: string[] = [];

    if (schema.body) {
      for (const field of schema.body) {
        if (
          req.body[field] === undefined ||
          req.body[field] === null ||
          req.body[field] === ''
        ) {
          missingFields.push(field);
        }
      }
    }

    if (missingFields.length > 0) {
      return next(
        new ApiError(400, `الحقول التالية مطلوبة: ${missingFields.join(', ')}`),
      );
    }

    next();
  };
};
