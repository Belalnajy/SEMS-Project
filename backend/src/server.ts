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
import partnerRoutes from './routes/partner.routes';

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
app.use('/api/partners', partnerRoutes);

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
// Every serverless request awaits initDB(). Running the body once per instance
// (and making concurrent cold-start requests share that one run) keeps a request
// from reading a table while another request is still creating or seeding it,
// and spares every later request a dozen schema queries.
let initPromise: Promise<void> | null = null;

export const initDB = (): Promise<void> => {
  if (!initPromise) {
    initPromise = runInitDB().catch((err) => {
      initPromise = null; // let the next request retry a failed start
      throw err;
    });
  }
  return initPromise;
};

const runInitDB = async () => {
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

  // Sections allowed per exam. No rows for an exam means "open to all sections".
  // Mirrors the join table TypeORM generates, since synchronize is off here.
  try {
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS exam_model_sections (
        exam_model_id INTEGER NOT NULL
          REFERENCES exam_models(id) ON UPDATE CASCADE ON DELETE CASCADE,
        section_id INTEGER NOT NULL
          REFERENCES sections(id) ON UPDATE CASCADE ON DELETE CASCADE,
        PRIMARY KEY (exam_model_id, section_id)
      )
    `);
    await AppDataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_exam_model_sections_section
         ON exam_model_sections (section_id)`,
    );
  } catch { /* table may already exist */ }

  // "شركاؤنا في النجاح": parent posts awaiting/after moderation, plus the
  // editable list of post types. Mirrors the PartnerPost/PartnerCategory entities.
  try {
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS partner_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS partner_posts (
        id SERIAL PRIMARY KEY,
        parent_name VARCHAR(100) NOT NULL,
        student_name VARCHAR(100),
        category VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        source VARCHAR(20) NOT NULL DEFAULT 'public',
        approved_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await AppDataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_partner_posts_status
         ON partner_posts (status, approved_at)`,
    );
    // Starter types requested by the school; editable in the dashboard
    await AppDataSource.query(`
      INSERT INTO partner_categories (name, sort_order)
      SELECT name, sort_order FROM (VALUES
        ('تعليق', 1), ('شكر', 2), ('استفسار', 3)
      ) AS defaults(name, sort_order)
      WHERE NOT EXISTS (SELECT 1 FROM partner_categories)
    `);
    // One-time switch from the first starter set (نشاط، ثقافي، معلمتي) to the
    // school's chosen types. Runs only while the table still holds exactly that
    // untouched set, so it never overrides types the school edited itself.
    await AppDataSource.query(`
      DELETE FROM partner_categories
      WHERE (SELECT COUNT(*) FROM partner_categories) = 3
        AND (SELECT COUNT(*) FROM partner_categories
              WHERE name IN ('نشاط', 'ثقافي', 'معلمتي')) = 3
    `);
    await AppDataSource.query(`
      INSERT INTO partner_categories (name, sort_order)
      SELECT name, sort_order FROM (VALUES
        ('تعليق', 1), ('شكر', 2), ('استفسار', 3)
      ) AS defaults(name, sort_order)
      WHERE NOT EXISTS (SELECT 1 FROM partner_categories)
    `);
  } catch { /* tables may already exist */ }
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
