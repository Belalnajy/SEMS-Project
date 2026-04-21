import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineUsers,
  HiOutlineLightBulb,
  HiOutlineUserGroup,
  HiOutlineClipboardList,
  HiOutlineEye,
} from 'react-icons/hi';

interface Stats {
  students: number;
  subjects: number;
  exams: number;
  sections: number;
  visitors: number;
}

export default function StatsOverview({ initialData }: { initialData?: Stats }) {
  const [stats, setStats] = useState<Stats>(
    initialData || {
      students: 0,
      subjects: 0,
      exams: 0,
      sections: 0,
      visitors: 0,
    }
  );

  useEffect(() => {
    if (!initialData) {
      api.get('/public/stats').then((res) => {
        setStats(res.data);
      }).catch(() => {});
    }
  }, [initialData]);

  const cards = [
    {
      label: 'نماذج الامتحانات',
      value: stats.exams,
      icon: HiOutlineAcademicCap,
      color: 'emerald',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-500',
      borderClass: 'border-emerald-500/20',
    },
    {
      label: 'المواد الدراسية',
      value: stats.subjects,
      icon: HiOutlineBookOpen,
      color: 'blue',
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-500',
      borderClass: 'border-blue-500/20',
    },
    {
      label: 'الطلاب',
      value: stats.students,
      icon: HiOutlineUsers,
      color: 'purple',
      bgClass: 'bg-purple-500/10',
      textClass: 'text-purple-500',
      borderClass: 'border-purple-500/20',
    },
    {
      label: 'مبادرة',
      value: 27,
      icon: HiOutlineLightBulb,
      color: 'teal',
      bgClass: 'bg-teal-500/10',
      textClass: 'text-teal-500',
      borderClass: 'border-teal-500/20',
    },
    {
      label: 'معلمة',
      value: 60,
      icon: HiOutlineUserGroup,
      color: 'pink',
      bgClass: 'bg-pink-500/10',
      textClass: 'text-pink-500',
      borderClass: 'border-pink-500/20',
    },
    {
      label: 'الفصول',
      value: stats.sections,
      icon: HiOutlineClipboardList,
      color: 'orange',
      bgClass: 'bg-orange-500/10',
      textClass: 'text-orange-500',
      borderClass: 'border-orange-500/20',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto" dir="rtl">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 relative overflow-hidden group shadow-2xl shadow-blue-500/5 text-center"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] group-hover:bg-blue-600/20 transition-all duration-700" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
          منصة التحصيلي
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium">
          مرحباً بك في نظام إدارة الامتحانات المدرسية
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {cards.map((card, i) => (
          <motion.div
            key={i}
            variants={item}
            whileHover={{ y: -5, borderColor: 'rgba(59, 130, 246, 0.3)' }}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 flex items-center justify-between group transition-all duration-300"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform">
                {card.value}
              </span>
              <span className="text-slate-400 font-bold text-sm tracking-wide">
                {card.label}
              </span>
            </div>
            <div className={`p-4 rounded-2xl border ${card.bgClass} ${card.borderClass} ${card.textClass} shadow-lg shadow-${card.color}-500/10`}>
              <card.icon className="h-8 w-8" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Visitor Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex items-center justify-center gap-4 group shadow-xl"
      >
        <div className="flex items-center gap-3 text-blue-400">
          <HiOutlineEye className="h-6 w-6 animate-pulse" />
          <span className="text-slate-400 font-bold">عدد زوار الموقع:</span>
        </div>
        <span className="text-2xl font-black text-blue-400 tracking-tighter group-hover:scale-110 transition-transform">
          {stats.visitors}
        </span>
      </motion.div>
    </div>
  );
}
