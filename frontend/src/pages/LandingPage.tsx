import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineClipboardCheck,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineDocumentDownload,
  HiOutlineArrowNarrowLeft,
  HiOutlinePlay,
} from 'react-icons/hi';
import StatsStrip from '../components/landing/StatsStrip';
import PartnersSection from '../components/PartnersSection';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const FEATURES = [
  {
    icon: HiOutlineClipboardCheck,
    title: 'اختبارات شاملة',
    description: 'بنك أسئلة يغطي الأحياء والكيمياء والفيزياء والرياضيات.',
  },
  {
    icon: HiOutlineChartBar,
    title: 'تقارير لحظية',
    description: 'تحليل فوري للمستوى يوضح مواطن القوة والضعف بعد كل اختبار.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'متابعة دقيقة',
    description: 'لوحة إدارة تتيح للمشرفات متابعة تقدم الطالبات والمجموعات.',
  },
  {
    icon: HiOutlineUserGroup,
    title: 'إدارة الشعب',
    description: 'تنظيم الطالبات في شعب دراسية لمتابعة النتائج حسب الفصل.',
  },
  {
    icon: HiOutlineAcademicCap,
    title: 'واجهة مريحة',
    description: 'تصميم واضح ومريح للعين يعمل على الجوال والحاسب بسلاسة.',
  },
  {
    icon: HiOutlineDocumentDownload,
    title: 'تصدير النتائج',
    description: 'استخراج تقارير الطالبات بصيغة PDF و Excel بضغطة واحدة.',
  },
];

export default function LandingPage() {
  // Track visitor on page load
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${baseURL}/public/track-visit`, { method: 'POST' }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200 overflow-x-hidden selection:bg-gold-400/30">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.jpeg"
              alt="شعار الثانوية الحادية والعشرون"
              className="h-10 w-10 sm:h-11 sm:w-11 flex-none rounded-xl object-cover ring-1 ring-gold-400/40 shadow-lg shadow-gold-500/10"
            />
            <div className="min-w-0 leading-tight">
              <p className="font-display font-bold text-white text-base sm:text-lg truncate">
                منصة التحصيلي
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                الثانوية الحادية والعشرون
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 flex-none">
            <a
              href="#features"
              className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              مميزات المنصة
            </a>
            <a
              href="#partners"
              className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              شركاؤنا في النجاح
            </a>
            <Link
              to="/login"
              className="whitespace-nowrap inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-gold-400/40 px-3.5 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white transition-all">
              تسجيل الدخول
              <HiOutlineArrowNarrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <header className="relative isolate pt-32 sm:pt-44 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 -z-10 bg-grid-fade" />
        <div className="absolute -z-10 top-[-12rem] left-1/2 -translate-x-1/2 h-[36rem] w-[min(68rem,140vw)] rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.28),transparent)]" />
        <div className="absolute -z-10 top-24 right-[-10rem] h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgb(227_184_95/0.14),transparent)]" />

        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}>
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/5 px-4 py-1.5 mb-7 sm:mb-9">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            <span className="text-xs sm:text-sm font-medium text-gold-200">
              الثانوية الحادية والعشرون · الاستعداد لاختبار التحصيلي
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display font-extrabold text-white text-[2.4rem] leading-[1.25] sm:text-6xl sm:leading-[1.2] lg:text-7xl tracking-tight mb-6 sm:mb-8">
            مستقبلك يبدأ مع
            <span className="block text-gold-gradient pb-2">منصة التحصيلي</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg md:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed sm:leading-loose mb-9 sm:mb-11">
            منصة تعليمية متكاملة صُممت لطالبات الثانوية الحادية والعشرون، تعزّز
            الاستعداد لاختبار التحصيلي باختبارات تحاكي الاختبار الفعلي وتقارير أداء
            دقيقة بعد كل محاولة.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
            <Link
              to="/guest"
              className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-linear-to-l from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-blue-700/30 ring-1 ring-white/10 transition-all hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0">
              <HiOutlinePlay className="h-5 w-5 transition-transform group-hover:scale-110" />
              ابدأ الاختبار كضيف
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-bold text-white backdrop-blur transition-all hover:border-gold-400/40 hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0">
              دخول الطالبات
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-10 sm:mt-12 text-sm text-slate-400">
            إعداد أ. ابتسام السلمي
            <span className="mx-2 text-slate-600">·</span>
            مديرة المدرسة / جميلة فهد المطيري
          </motion.p>
        </motion.div>
      </header>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-20 sm:pb-28">
        <StatsStrip />
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-24 px-4 sm:px-6 py-20 sm:py-28 border-y border-white/5 bg-ink-900/60">
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="لماذا منصة التحصيلي" title="كل ما تحتاجه الطالبة للاستعداد" />

          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
                className="group relative flex gap-4 sm:block rounded-2xl sm:rounded-3xl border border-white/8 bg-white/[0.02] p-5 sm:p-8 transition-all duration-300 hover:border-gold-400/30 hover:bg-white/[0.04]">
                <div className="flex-none flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl border border-gold-400/20 bg-gold-400/5 sm:mb-6 transition-colors group-hover:bg-gold-400/10">
                  <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-gold-300" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── شركاؤنا في النجاح ─────────────────────────────────────────── */}
      <PartnersSection />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-ink-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 text-center lg:text-start">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <img
              src="/logo.jpeg"
              alt=""
              className="h-14 w-14 rounded-2xl object-cover ring-1 ring-gold-400/30"
            />
            <div>
              <p className="font-display font-bold text-white text-lg">منصة التحصيلي</p>
              <p className="text-sm text-slate-400 mt-1">الثانوية الحادية والعشرون</p>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">مميزات المنصة</a>
            <a href="#partners" className="hover:text-white transition-colors">شركاؤنا في النجاح</a>
            <Link to="/guest" className="hover:text-white transition-colors">الاختبار كضيف</Link>
            <Link to="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link>
          </nav>

          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-gold-200">إعداد أ. ابتسام السلمي</p>
            <p className="text-slate-400">مديرة المدرسة / جميلة فهد المطيري</p>
          </div>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
          الثانوية الحادية والعشرون — جميع الحقوق محفوظة © 2026
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center">
      <p className="text-sm font-semibold tracking-wide text-gold-300 mb-3">{eyebrow}</p>
      <h2 className="font-display text-[1.75rem] leading-snug sm:text-4xl font-bold text-white">{title}</h2>
      <div className="mx-auto mt-5 h-px w-24 bg-linear-to-l from-transparent via-gold-400 to-transparent" />
    </motion.div>
  );
}
