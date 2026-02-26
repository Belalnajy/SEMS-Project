import { Router } from 'express';
import {
  getAllSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
} from '../controllers/section.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(authenticate);

router.get('/', roleGuard(['supervisor', 'manager']), getAllSections);
router.get('/:id', roleGuard(['supervisor', 'manager']), getSectionById);
router.post('/', roleGuard(['supervisor']), createSection);
router.put('/:id', roleGuard(['supervisor']), updateSection);
router.delete('/:id', roleGuard(['supervisor']), deleteSection);

export default router;
