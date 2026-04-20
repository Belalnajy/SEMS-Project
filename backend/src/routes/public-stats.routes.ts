import { Router } from 'express';
import {
  getPublicStats,
  trackVisitor,
} from '../controllers/public-stats.controller';

const router = Router();

router.get('/stats', getPublicStats);
router.post('/track-visit', trackVisitor);

export default router;
