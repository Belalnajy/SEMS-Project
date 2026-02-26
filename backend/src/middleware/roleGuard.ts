import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

export const roleGuard = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return next(new ApiError(401, 'غير مصرح لك بالوصول.'));
    }

    if (!roles.includes(req.user.role.name)) {
      return next(
        new ApiError(403, 'ليس لديك الصلاحيات الكافية للوصول لهذا المسار.'),
      );
    }

    next();
  };
};
