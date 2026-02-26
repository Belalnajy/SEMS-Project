import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  validate({ body: ['national_id', 'username', 'password'] }),
  register,
);
router.post('/login', validate({ body: ['national_id', 'password'] }), login);
router.get('/me', authenticate, getMe);

export default router;
