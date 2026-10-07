import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getCategories,
  getApprovedPosts,
  submitPost,
  getAdminPosts,
  createAdminPost,
  updatePost,
  approvePost,
  unpublishPost,
  deletePost,
  addCategory,
  deleteCategory,
} from '../controllers/partner.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

// Parents send from their own homes and phones, so a per-IP cap is meaningful
// here (unlike exam traffic, which all comes from the school's single IP).
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'لقد أرسلت عدة مشاركات مؤخراً. يرجى المحاولة بعد ساعة.' },
});

// Public: visitors read published posts and send new ones for review
router.get('/categories', getCategories);
router.get('/posts', getApprovedPosts);
router.post('/posts', submitLimiter, submitPost);

// Admin: the supervisor and the principal (manager) moderate everything
router.use('/admin', authenticate, roleGuard(['supervisor', 'manager']));
router.get('/admin/posts', getAdminPosts);
router.post('/admin/posts', createAdminPost);
router.put('/admin/posts/:id', updatePost);
router.patch('/admin/posts/:id/approve', approvePost);
router.patch('/admin/posts/:id/unpublish', unpublishPost);
router.delete('/admin/posts/:id', deletePost);
router.post('/admin/categories', addCategory);
router.delete('/admin/categories/:id', deleteCategory);

export default router;
