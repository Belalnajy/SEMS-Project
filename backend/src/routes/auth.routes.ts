import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
} from '../controllers/auth.controller';
import { seedDatabase } from '../controllers/seed.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Temporary Seed Route - DELETE after first use in production!
router.get('/seed-demo', seedDatabase);

router.post(
  '/register',
  validate({ body: ['national_id', 'username', 'password'] }),
  register,
);
router.post('/login', validate({ body: ['national_id', 'password'] }), login);
router.get('/me', authenticate, getMe);
router.put('/update-profile', authenticate, updateProfile);

export default router;
