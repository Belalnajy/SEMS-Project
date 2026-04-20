import 'express-async-errors';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';

import { AppDataSource } from './config/data-source';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import sectionRoutes from './routes/section.routes';
import subjectRoutes from './routes/subject.routes';
import examRoutes from './routes/exam.routes';
import reportRoutes from './routes/report.routes';
import guestRoutes from './routes/guest.routes';
import publicStatsRoutes from './routes/public-stats.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: 'تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً',
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/public', publicStatsRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'نظام إدارة الامتحانات يعمل بنجاح (TypeScript)',
  });
});

app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'المسار غير موجود.' });
});

// Error Handler
app.use(errorHandler);

// Database connection helper
export const initDB = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📦 Connected to PostgreSQL via TypeORM');
  }

  // Auto-create site_visitors table if it doesn't exist (safe for production)
  try {
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS site_visitors (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR,
        visited_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch { /* table may already exist */ }
};

// Start server only in non-Vercel environments
if (!process.env.VERCEL) {
  initDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      });
    })
    .catch((error) => console.log('❌ TypeORM connection error: ', error));
}

export default app;
