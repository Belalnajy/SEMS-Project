import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineClipboardCheck,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineArrowNarrowLeft,
  HiOutlineEye,
  HiOutlineLightBulb,
} from 'react-icons/hi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || target === 0) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString('ar-SA')}</span>;
}

export default function LandingPage() {
  const [publicStats, setPublicStats] = useState({ students: 0, visitors: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/stats`);
        setPublicStats(res.data);
      } catch { /* silent */ }
    };
    const trackVisit = async () => {
      try {
        await axios.post(`${API_URL}/public/track-visit`);
      } catch { /* silent */ }
    };
    fetchStats();
    trackVisit();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/50 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <HiOutlineAcademicCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              منصة التحصيلي
            </span>
          </div>

          <Link
            to="/login"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all border border-slate-700 hover:border-blue-500/50">
            تسجيل الدخول
            <HiOutlineArrowNarrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-4">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] animate-bounce" />
        </div>

        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}>
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-sm font-bold text-blue-400">
              الإصدار 1.0 متاح الآن
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold text-white mb-8 leading-[1.1]">
            مستقبلك يبدأ مع <br />
            <span className="bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent italic">
              منصة التحصيلي
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-arabic">
            منصة تعليمية متكاملة مصممة خصيصاً لطلاب الثانوية الحادية والعشرون
            لتعزيز مهاراتهم في التحصيلي من خلال اختبارات ذكية وتقارير أداء دقيقة
            بإشراف أ. ابتسام السلمي، وبمتابعة مديرة المدرسة/ جميلة فهد المطيري.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              to="/login"
              className="w-full sm:w-auto px-10 py-4 bg-slate-800/50 backdrop-blur border border-slate-700 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl transition-all hover:scale-105 active:scale-95">
              دخول الطلاب
            </Link>
            <Link
              to="/guest"
              className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xl transition-all shadow-xl shadow-blue-600/25 hover:scale-105 active:scale-95">
              ابدأ الاختبار كضيف
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Counters */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: 'طالبة',
                value: publicStats.students,
                icon: HiOutlineUserGroup,
                gradient: 'from-purple-500/20 to-purple-600/5',
                iconBg: 'bg-purple-500/15',
                iconColor: 'text-purple-400',
                border: 'border-purple-500/20',
              },
              {
                label: 'معلمة',
                value: 60,
                icon: HiOutlineAcademicCap,
                gradient: 'from-amber-500/20 to-amber-600/5',
                iconBg: 'bg-amber-500/15',
                iconColor: 'text-amber-400',
                border: 'border-amber-500/20',
              },
              {
                label: 'مبادرة',
                value: 27,
                icon: HiOutlineLightBulb,
                gradient: 'from-emerald-500/20 to-emerald-600/5',
                iconBg: 'bg-emerald-500/15',
                iconColor: 'text-emerald-400',
                border: 'border-emerald-500/20',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className={`relative overflow-hidden bg-linear-to-br ${stat.gradient} backdrop-blur-sm border ${stat.border} rounded-2xl p-6 text-center`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className={`${stat.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                </div>
                <h3 className="text-4xl font-extrabold text-white mb-1">
                  <AnimatedCounter target={stat.value} />
                </h3>
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <HiOutlineEye className="h-6 w-6 text-blue-400" />
            <span className="text-slate-400 font-medium">عدد زوار الموقع:</span>
            <span className="text-2xl font-bold text-white">
              <AnimatedCounter target={publicStats.visitors} />
            </span>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              مميزات المنصة
            </h2>
            <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <HiOutlineClipboardCheck className="h-8 w-8 text-blue-400" />
              }
              title="اختبارات شاملة"
              description="بنك أسئلة ضخم يغطي مجالات الأحياء، الكيمياء، الفيزياء، والرياضيات."
            />
            <FeatureCard
              icon={<HiOutlineChartBar className="h-8 w-8 text-indigo-400" />}
              title="تقارير لحظية"
              description="تحليل فوري لمستواك وتوضيح لمكامن القوة والضعف بعد كل اختبار."
            />
            <FeatureCard
              icon={
                <HiOutlineShieldCheck className="h-8 w-8 text-emerald-400" />
              }
              title="رقابة تامة"
              description="نظام إدارة متطور يسمح للمشرفين بمتابعة تقدم الطلاب والمجموعات."
            />
            <FeatureCard
              icon={<HiOutlineUserGroup className="h-8 w-8 text-orange-400" />}
              title="إدارة الشعب"
              description="تنظيم الطلاب في شعب دراسية لتسهيل متابعة النتائج حسب الفصل."
            />
            <FeatureCard
              icon={<HiOutlineAcademicCap className="h-8 w-8 text-pink-400" />}
              title="واجهة سلسة"
              description="تصميم عصري ومريح للعين يدعم القراءة بوضوح في جميع الأجهزة."
            />
            <FeatureCard
              icon={
                <HiOutlineArrowNarrowLeft className="h-8 w-8 text-cyan-400" />
              }
              title="تصدير النتائج"
              description="إمكانية استخراج تقارير الطلاب بصيغة PDF و Excel بضغطة واحدة."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 mb-4">
            الثانوية الحادية والعشرون - جميع الحقوق محفوظة © 2026
          </p>
          <p className="text-slate-400 font-bold">إعداد أ. ابتسام السلمي</p>
          <p className="text-slate-500 text-sm mt-1">مديرة المدرسة/ جميلة فهد المطيري</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:border-blue-500/30 transition-all group">
      <div className="bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 group-hover:bg-blue-900/20 group-hover:border-blue-500/30 transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}
