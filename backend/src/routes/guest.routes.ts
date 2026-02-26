import { Router } from 'express';
import {
  getAllExams,
  startExam,
  submitExam,
} from '../controllers/guest.controller';

const router = Router();

router.get('/exams', getAllExams);
router.get('/exams/:id/start', startExam);
router.post('/exams/:id/submit', submitExam);

export default router;
