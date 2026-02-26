import { useState, useEffect } from 'react';
import api from '../../api/client';
import { HiOutlineChartBar } from 'react-icons/hi';
import { motion } from 'framer-motion';

interface PerformanceStat {
  subject_id: number;
  subject_name: string;
  avg_percentage: string;
  total_attempts: number;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<PerformanceStat[]>([]);

  useEffect(() => {
    api
      .get<PerformanceStat[] | { stats: PerformanceStat[] }>(
        '/reports/performance',
      )
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setStats(data);
        } else if (data && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm">
        <h1 className="text-2xl font-bold text-white mb-2">لوحة تحكم المدير</h1>
        <p className="text-slate-400">عرض تقارير الأداء العام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}>
            <div className="p-4 rounded-xl border bg-blue-500/10 text-blue-500 border-blue-500/20">
              <HiOutlineChartBar className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {parseFloat(s.avg_percentage || '0').toFixed(1)}%
              </h3>
              <p className="text-sm font-medium text-slate-400 mt-1">
                {s.subject_name} — {s.total_attempts} محاولة
              </p>
            </div>
          </motion.div>
        ))}
        {stats.length === 0 && (
          <div className="col-span-full bg-slate-800/50 rounded-xl p-8 border border-slate-700/50 border-dashed text-center text-slate-400">
            لا توجد بيانات متاحة لعرض التقارير حالياً.
          </div>
        )}
      </div>
    </div>
  );
}
