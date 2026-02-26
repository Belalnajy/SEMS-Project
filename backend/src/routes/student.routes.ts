import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
} from '../controllers/student.controller';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(roleGuard(['supervisor']));

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.post(
  '/',
  validate({ body: ['full_name', 'national_id', 'password'] }),
  createStudent,
);
router.post('/import', upload.single('file'), importStudents);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
