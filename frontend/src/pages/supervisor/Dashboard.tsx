import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/client';
import {
  HiOutlineUsers,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClipboardList,
} from 'react-icons/hi';

interface Stats {
  students: number;
  subjects: number;
  exams: number;
  sections: number;
}

export default function SupervisorDashboard() {
  const [stats, setStats] = useState<Stats>({
    students: 0,
    subjects: 0,
    exams: 0,
    sections: 0,
  });

  useEffect(() => {
    Promise.all([
      api
        .get('/students?limit=1')
        .catch(() => ({ data: { pagination: { total: 0 } } })),
      api.get('/subjects').catch(() => ({ data: [] })),
      api.get('/exams').catch(() => ({ data: [] })),
      api.get('/sections').catch(() => ({ data: [] })),
    ]).then(([s, sub, ex, sec]) => {
      setStats({
        students: s.data.pagination?.total || 0,
        subjects: sub.data.length || 0,
        exams: ex.data.length || 0,
        sections: sec.data.length || 0,
      });
    });
  }, []);

  const cards = [
    {
      label: 'الطلاب',
      value: stats.students,
      icon: HiOutlineUsers,
      colorClass: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    },
    {
      label: 'المواد الدراسية',
      value: stats.subjects,
      icon: HiOutlineBookOpen,
      colorClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    {
      label: 'نماذج الامتحانات',
      value: stats.exams,
      icon: HiOutlineAcademicCap,
      colorClass: 'bg-green-500/10 text-green-500 border-green-500/20',
    },
    {
      label: 'الفصول',
      value: stats.sections,
      icon: HiOutlineClipboardList,
      colorClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm">
        <h1 className="text-2xl font-bold text-white mb-2">منصة التحصيلي</h1>
        <p className="text-slate-400">
          مرحباً بك في نظام إدارة الامتحانات المدرسية
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}>
            <div className={`p-4 rounded-xl border ${card.colorClass}`}>
              <card.icon className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">{card.value}</h3>
              <p className="text-sm font-medium text-slate-400">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
