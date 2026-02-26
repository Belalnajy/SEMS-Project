import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

const reportService = new ReportService();

export const getPerformance = async (req: Request, res: Response) => {
  try {
    const stats = await reportService.getOverallStats(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب إحصائيات الأداء' });
  }
};

export const getStudentsReport = async (req: Request, res: Response) => {
  try {
    const reports = await reportService.getPerformanceReports(req.query);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب تقارير الطلاب' });
  }
};

export const getSectionRanking = async (req: Request, res: Response) => {
  try {
    const ranking = await reportService.getSectionRanking();
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب ترتيب الشُعب' });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const reports = await reportService.getPerformanceReports(req.query);
    const buffer = await reportService.generateExcelBuffer(reports);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sems-report.xlsx',
    );
    res.send(buffer);
  } catch (error: any) {
    console.error('Excel Export Error:', error);
    res
      .status(500)
      .json({ error: 'فشل تصدير ملف Excel', details: error.message });
  }
};

export const exportPdf = async (req: Request, res: Response) => {
  try {
    const reports = await reportService.getPerformanceReports(req.query);
    const buffer = await reportService.generatePdfBuffer(reports);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sems-report.pdf',
    );
    res.send(buffer);
  } catch (error: any) {
    console.error('PDF Export Error:', error);
    res
      .status(500)
      .json({ error: 'فشل تصدير ملف PDF', details: error.message });
  }
};
