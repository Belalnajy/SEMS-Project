import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { inView, reveal, stagger } from './motion';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineUsers,
  HiOutlineLightBulb,
  HiOutlineUserGroup,
  HiOutlineClipboardList,
  HiOutlineEye,
} from 'react-icons/hi';
import api from '../../api/client';

interface Stats {
  students: number;
  subjects: number;
  exams: number;
  sections: number;
  visitors: number;
}

const EMPTY: Stats = { students: 0, subjects: 0, exams: 0, sections: 0, visitors: 0 };

/** يعدّ من الصفر إلى القيمة مرة واحدة عند ظهور الرقم — ويقفز مباشرة لمن يفضّل تقليل الحركة. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce || value === 0) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, reduce]);

  return <span ref={ref}>{shown.toLocaleString('en-US')}</span>;
}

/**
 * فواصل الشبكة لكل مقاس على حدة: عمودان على الجوال، ثلاثة على التابلت، ستة على الحاسب.
 * border-r هو الحدّ الملاصق للعنصر السابق في اتجاه RTL.
 */
function dividers(index: number) {
  return [
    index % 2 === 1 ? 'border-r' : 'border-r-0',
    index < 4 ? 'border-b' : 'border-b-0',
    index % 3 !== 0 ? 'sm:border-r' : 'sm:border-r-0',
    index < 3 ? 'sm:border-b' : 'sm:border-b-0',
    index !== 0 ? 'lg:border-r' : 'lg:border-r-0',
    'lg:border-b-0',
  ].join(' ');
}

/** شريط الأرقام في الصفحة الرئيسية. لوحة المشرفة لها مكوّنها الخاص (StatsOverview). */
export default function StatsStrip() {
  const [stats, setStats] = useState<Stats>(EMPTY);

  useEffect(() => {
    api
      .get<Stats>('/public/stats')
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const items = [
    { label: 'نماذج الاختبارات', value: stats.exams, icon: HiOutlineAcademicCap },
    { label: 'المواد الدراسية', value: stats.subjects, icon: HiOutlineBookOpen },
    { label: 'الطالبات', value: stats.students, icon: HiOutlineUsers },
    { label: 'الفصول', value: stats.sections, icon: HiOutlineClipboardList },
    { label: 'معلمة', value: 60, icon: HiOutlineUserGroup },
    { label: 'مبادرة', value: 27, icon: HiOutlineLightBulb },
  ];

  return (
    <motion.div
      variants={stagger(0.1, 0.07)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className="relative max-w-6xl mx-auto rounded-3xl border-gradient border-conic shadow-2xl shadow-black/40 overflow-hidden shimmer-sweep">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            variants={reveal}
            className={`group flex flex-col items-center justify-center gap-2 px-3 py-7 sm:py-9 text-center border-white/5 ${dividers(index)}`}>
            <item.icon className="h-6 w-6 text-gold-400/80 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-110" />
            <span className="font-display text-3xl sm:text-4xl font-bold text-white tabular-nums">
              <CountUp value={item.value} />
            </span>
            <span className="text-sm text-slate-400">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div variants={reveal} className="flex items-center justify-center gap-2.5 border-t border-white/5 px-4 py-4 text-sm text-slate-400">
        <HiOutlineEye className="h-5 w-5 text-gold-400/80" />
        عدد زوار الموقع
        <span className="font-display text-lg font-bold text-gold-200 tabular-nums">
          <CountUp value={stats.visitors} />
        </span>
      </motion.div>
    </motion.div>
  );
}
