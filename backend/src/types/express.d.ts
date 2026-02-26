import { Request } from 'express';
import { User } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Will be populated by auth middleware
    }
  }
}
