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

// Vercel puts exactly one proxy in front of the app. Without this the rate
// limiter keys on the proxy address instead of the visitor's IP.
app.set('trust proxy', 1);

// Middlewares
app.use(helmet());
app.use(cors());
// Large limit so question images (base64 data URIs) fit in JSON bodies
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(morgan('dev'));

// Rate limiting.
// A whole school sits behind a single public IP, so limits here are shared by
// every student at once. They are set high enough that a class taking an exam
// together never trips them, while still stopping a runaway client.
const isQuestionImage = (req: Request) =>
  /^\/api\/exams\/questions\/\d+\/image$/.test(req.originalUrl.split('?')[0]);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000,
  message: 'تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً',
  // Question images are one request per question; they would dominate the
  // budget and their handler is a cheap cached read.
  skip: isQuestionImage,
});
app.use('/api', limiter);

// Login is the one endpoint worth guarding against guessing, but the cap still
// has to clear a class of students signing in within the same few minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد قليل',
});
app.use('/api/auth/login', loginLimiter);

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

  // Auto-add question image column (synchronize is off in production)
  try {
    await AppDataSource.query(
      `ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT`,
    );
  } catch { /* column may already exist */ }
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
