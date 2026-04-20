import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Student } from '../entities/Student';
import { SiteVisitor } from '../entities/SiteVisitor';

export const getPublicStats = async (req: Request, res: Response) => {
  try {
    const studentCount = await AppDataSource.getRepository(Student).count();

    let visitorCount = 0;
    try {
      visitorCount = await AppDataSource.getRepository(SiteVisitor).count();
    } catch {
      // Table may not exist yet in production - gracefully return 0
    }

    res.json({
      students: studentCount,
      visitors: visitorCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الإحصائيات' });
  }
};

export const trackVisitor = async (req: Request, res: Response) => {
  try {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';

    const repo = AppDataSource.getRepository(SiteVisitor);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await repo
      .createQueryBuilder('v')
      .where('v.ip_address = :ip', { ip })
      .andWhere('v.visited_at >= :today', { today })
      .getOne();

    if (!existing) {
      const visitor = new SiteVisitor();
      visitor.ip_address = ip;
      await repo.save(visitor);
    }

    res.json({ tracked: true });
  } catch {
    // Silently fail - visitor tracking should never block the user
    res.json({ tracked: false });
  }
};
