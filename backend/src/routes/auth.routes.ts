import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// NOTE: /seed-demo and /fix-model4 were removed. They were unauthenticated GET
// routes that reset the supervisor password to a known value and deleted every
// question and answer of an exam. Seeding now runs from scripts/seed.ts only.

router.post(
  '/register',
  validate({ body: ['national_id', 'username', 'password'] }),
  register,
);
router.post('/login', validate({ body: ['national_id', 'password'] }), login);
router.get('/me', authenticate, getMe);
router.put('/update-profile', authenticate, updateProfile);

export default router;
