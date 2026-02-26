import { Router } from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// All roles can view subjects (e.g., student dashboard)
router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);

// Only supervisor can modify subjects
router.use(roleGuard(['supervisor']));
router.post('/', validate({ body: ['name'] }), createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
