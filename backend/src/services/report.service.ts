import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import ejs from 'ejs';
import puppeteer from 'puppeteer-core';
import { AppDataSource } from '../config/data-source';
import { Result } from '../entities/Result';
import { ApiError } from '../middleware/errorHandler';

export class ReportService {
  private resultRepository = AppDataSource.getRepository(Result);

  async getPerformanceReports(filters: any) {
    const { section_id, subject_id, student_id } = filters;

    // using QueryBuilder for complex aggregations and joins
    const query = this.resultRepository
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.student', 'student')
      .leftJoinAndSelect('student.section', 'section')
      .leftJoinAndSelect('result.exam_model', 'exam_model')
      .leftJoinAndSelect('exam_model.subject', 'subject')
      .where('result.is_guest = :isGuest', { isGuest: false }); // Exclude guests from core analytics

    if (section_id) {
      query.andWhere('section.id = :sectionId', { sectionId: section_id });
    }
    if (subject_id) {
      query.andWhere('subject.id = :subjectId', { subjectId: subject_id });
    }
    if (student_id) {
      query.andWhere('student.id = :studentId', { studentId: student_id });
    }

    query.orderBy('result.completed_at', 'DESC');

    const rawResults = await query.getMany();

    // Mapping to the expected flatten structure for the frontend
    return rawResults.map((r) => ({
      result_id: r.id,
      student_name: r.student?.full_name,
      student_number: r.student?.student_number,
      section_name: r.student?.section?.name,
      'اسم الطالب': r.student?.full_name,
      'رقم الطالب': r.student?.student_number,
      الفصل: r.student?.section?.name,
      المادة: r.exam_model?.subject?.name,
      النموذج: r.exam_model?.name,
      الدرجة: r.score,
      'إجمالي الأسئلة': r.total_questions,
      النسبة: Number(r.percentage).toFixed(2) + '%',
      التاريخ: r.completed_at
        ? new Date(r.completed_at).toLocaleDateString('ar-EG')
        : '',
      subject_name: r.exam_model?.subject?.name,
      exam_name: r.exam_model?.name,
      score: r.score,
      total_questions: r.total_questions,
      percentage: Number(r.percentage),
      completed_at: r.completed_at,
    }));
  }

  async getOverallStats(filters: any = {}) {
    const { section_id, subject_id } = filters;

    const qb = this.resultRepository
      .createQueryBuilder('result')
      .leftJoin('result.exam_model', 'exam_model')
      .leftJoin('exam_model.subject', 'subject')
      .leftJoin('result.student', 'student')
      .leftJoin('student.section', 'section')
      .where('result.is_guest = :isGuest', { isGuest: false });

    if (section_id) {
      qb.andWhere('section.id = :sectionId', { sectionId: section_id });
    }
    if (subject_id) {
      qb.andWhere('subject.id = :subjectId', { subjectId: subject_id });
    }

    qb.select('subject.id', 'subject_id')
      .addSelect('subject.name', 'subject_name')
      .addSelect('COUNT(result.id)', 'total_attempts')
      .addSelect('AVG(result.percentage)', 'avg_percentage')
      .groupBy('subject.id')
      .addGroupBy('subject.name')
      .orderBy('total_attempts', 'DESC');

    const stats = await qb.getRawMany();

    return stats.map((s) => ({
      subject_id: Number(s.subject_id),
      subject_name: s.subject_name,
      total_attempts: Number(s.total_attempts) || 0,
      avg_percentage: Number(s.avg_percentage)
        ? Number(s.avg_percentage).toFixed(2)
        : '0.00',
    }));
  }

  async getSectionRanking() {
    const qb = this.resultRepository
      .createQueryBuilder('result')
      .innerJoin('result.student', 'student')
      .innerJoin('student.section', 'section')
      .where('result.is_guest = :isGuest', { isGuest: false })
      .select('section.id', 'section_id')
      .addSelect('section.name', 'section_name')
      .addSelect('AVG(result.percentage)', 'avg_percentage')
      .addSelect('COUNT(DISTINCT student.id)', 'total_students')
      .addSelect('COUNT(result.id)', 'total_exams')
      .groupBy('section.id')
      .addGroupBy('section.name')
      .orderBy('avg_percentage', 'DESC');

    const ranking = await qb.getRawMany();
    return ranking.map((r) => ({
      section_id: Number(r.section_id),
      section_name: r.section_name,
      avg_percentage: Number(r.avg_percentage)
        ? Number(r.avg_percentage).toFixed(2)
        : '0.00',
      total_students: Number(r.total_students) || 0,
      total_exams: Number(r.total_exams) || 0,
    }));
  }

  // Basic Excel generator
  async generateExcelBuffer(data: any[]): Promise<Buffer> {
    // Pick only the Arabic keys for Excel export
    const excelData = data.map((item) => ({
      'اسم الطالب': item['اسم الطالب'],
      'رقم الطالب': item['رقم الطالب'],
      الفصل: item['الفصل'],
      المادة: item['المادة'],
      النموذج: item['النموذج'],
      الدرجة: item['الدرجة'],
      'إجمالي الأسئلة': item['إجمالي الأسئلة'],
      النسبة: item['النسبة'],
      التاريخ: item['التاريخ'],
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generatePdfBuffer(data: any[]): Promise<Buffer> {
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(
      `[PDF] Current Info - CWD: ${process.cwd()}, Dirname: ${__dirname}`,
    );

    // Find base path for assets/templates
    const possibleBases = [
      path.join(process.cwd(), 'backend/src'), // Root in Vercel is /var/task
      path.join(process.cwd(), 'src'),
      path.join(__dirname, '../src'),
      path.join(__dirname, '..'),
      path.join(__dirname, '../..'),
      '/var/task/backend/src',
    ];

    let basePath = '';
    for (const b of possibleBases) {
      const checkPath = path.join(b, 'templates/report.ejs');
      console.log(`[PDF] Checking exists: ${checkPath}`);
      if (fs.existsSync(checkPath)) {
        basePath = b;
        console.log(`[PDF] ✅ Found resources at: ${basePath}`);
        break;
      }
    }

    if (!basePath) {
      const errorMsg = `تعذر العثور على ملفات التقارير. تم فحص المجلدات، المرجو التأكد من رفعها. [${process.cwd()}]`;
      console.error(`[PDF] Error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const templatePath = path.join(basePath, 'templates/report.ejs');
    const regularFontPath = path.join(
      basePath,
      'assets/fonts/Tajawal-Regular.ttf',
    );
    const boldFontPath = path.join(basePath, 'assets/fonts/Tajawal-Bold.ttf');

    let regularFont = '';
    let boldFont = '';

    if (fs.existsSync(regularFontPath)) {
      regularFont = fs.readFileSync(regularFontPath).toString('base64');
    }
    if (fs.existsSync(boldFontPath)) {
      boldFont = fs.readFileSync(boldFontPath).toString('base64');
    }

    const html = await ejs.renderFile(templatePath, {
      data,
      regularFont,
      boldFont,
    });

    let browser;
    try {
      if (isProduction) {
        // Vercel / Serverless Configuration
        const chromium = require('@sparticuz/chromium-min');
        browser = await puppeteer.launch({
          args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar',
          ),
          headless: true,
        });
      } else {
        // Local Configuration
        browser = await puppeteer.launch({
          executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true,
        });
      }

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });

      await browser.close();
      return Buffer.from(pdf);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      if (browser) await browser.close();
      throw error;
    }
  }
}
