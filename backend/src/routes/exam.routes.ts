import { Router } from 'express';
import {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  addQuestion,
  deleteQuestion,
  updateQuestion,
  getExamQuestions,
  getMyResults,
  startExam,
  submitExam,
  reportQuestion,
  importQuestions,
} from '../controllers/exam.controller';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import { roleGuard } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Everyone authenticated can view
router.get('/', getAllExams);
router.get('/my/results', getMyResults);
router.get('/:id', getExamById);
router.get('/:id/questions', getExamQuestions);
router.post('/:id/start', startExam);
router.post('/:id/submit', submitExam);
router.post('/:id/questions/:questionId/report', roleGuard(['student']), reportQuestion);

// Only supervisor manages contents
router.use(roleGuard(['supervisor']));
router.post('/', validate({ body: ['subject_id', 'name'] }), createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

router.post(
  '/:id/questions',
  validate({ body: ['question_text', 'answers'] }),
  addQuestion,
);
router.put(
  '/:id/questions/:questionId',
  validate({ body: ['question_text', 'answers'] }),
  updateQuestion,
);
router.delete('/:id/questions/:questionId', deleteQuestion);

router.post('/:id/import-questions', upload.single('file'), importQuestions);

export default router;
