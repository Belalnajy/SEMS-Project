import 'reflect-metadata';
import app, { initDB } from '../src/server';

export default async (req: any, res: any) => {
  try {
    await initDB();
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel Entry Point Error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'حدث خطأ في الاتصال بقاعدة البيانات أو التهيئة',
        details: err.message,
      });
    }
  }
};
