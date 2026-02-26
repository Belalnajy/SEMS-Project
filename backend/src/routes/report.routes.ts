import { Router } from 'express';
import {
  getPerformance,
  getStudentsReport,
  getSectionRanking,
  exportExcel,
  exportPdf,
} from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(authenticate);
// Supervisor and Manager can access reports
router.use(roleGuard(['supervisor', 'manager']));

router.get('/performance', getPerformance);
router.get('/students', getStudentsReport);
router.get('/sections', getSectionRanking);
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPdf);

export default router;
