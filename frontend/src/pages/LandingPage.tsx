import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
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
  HiOutlineChevronDown,
} from 'react-icons/hi';
import StatsStrip from '../components/landing/StatsStrip';
import PartnersSection from '../components/PartnersSection';
import HeroBackground from '../components/landing/HeroBackground';
import RevealText from '../components/landing/RevealText';
import SpotlightCard from '../components/landing/SpotlightCard';
import MagneticButton from '../components/landing/MagneticButton';
import ScrollProgress from '../components/landing/ScrollProgress';
import { EASE_OUT, inView, reveal, revealSoft, stagger } from '../components/landing/motion';

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

const NAV_LINKS = [
  { href: '#features', label: 'مميزات المنصة' },
  { href: '#partners', label: 'شركاؤنا في النجاح' },
];

export default function LandingPage() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24));

  // المحتوى يتراجع ويخفت قليلاً مع التمرير — عمق بسيط بلا إزعاج
  const heroY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 90]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, reduce ? 1 : 0.35]);

  // Track visitor on page load
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${baseURL}/public/track-visit`, { method: 'POST' }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200 overflow-x-hidden selection:bg-gold-400/30">
      <ScrollProgress />

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <motion.nav
        initial={reduce ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className={`fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,box-shadow] duration-500 ${
          scrolled
            ? 'bg-ink-950/80 backdrop-blur-xl border-b border-white/8 shadow-[0_8px_40px_rgb(0_0_0/0.35)]'
            : 'bg-transparent border-b border-transparent'
        }`}>
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 transition-[height] duration-500 ${
            scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'
          }`}>
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            <img
              src="/logo.jpeg"
              alt="شعار الثانوية الحادية والعشرون"
              className="h-10 w-10 sm:h-11 sm:w-11 flex-none rounded-xl object-cover ring-1 ring-gold-400/40 shadow-lg shadow-gold-500/10 transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105"
            />
            <div className="min-w-0 leading-tight">
              <p className="font-display font-bold text-white text-base sm:text-lg truncate">منصة التحصيلي</p>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">الثانوية الحادية والعشرون</p>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 flex-none">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative hidden md:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors after:absolute after:bottom-1 after:right-4 after:left-4 after:h-px after:origin-right after:scale-x-0 after:bg-gold-400 after:transition-transform after:duration-300 hover:after:scale-x-100">
                {link.label}
              </a>
            ))}
            <MagneticButton strength={0.15}>
              <Link
                to="/login"
                className="whitespace-nowrap inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-gold-400/40 px-3.5 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white transition-colors">
                تسجيل الدخول
                <HiOutlineArrowNarrowLeft className="h-4 w-4" />
              </Link>
            </MagneticButton>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <header className="relative isolate min-h-[100svh] flex flex-col justify-center pt-28 sm:pt-32 pb-24 px-4 sm:px-6">
        <HeroBackground />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-4xl mx-auto text-center w-full">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/5 px-4 py-1.5 mb-8 sm:mb-10 backdrop-blur">
            <span className="relative h-1.5 w-1.5 rounded-full bg-gold-400 live-dot" />
            <span className="text-xs sm:text-sm font-medium text-gold-200">
              الثانوية الحادية والعشرون · الاستعداد لاختبار التحصيلي
            </span>
          </motion.div>

          <h1 className="font-display font-extrabold text-white text-[2.5rem] leading-[1.22] sm:text-6xl sm:leading-[1.18] lg:text-[5.25rem] tracking-tight mb-6 sm:mb-8">
            <RevealText text="مستقبلك يبدأ مع" delay={0.25} className="block" />
            <RevealText text="منصة التحصيلي" delay={0.5} className="block pb-2" wordClassName="text-gold-gradient" />
          </h1>

          <motion.p
            variants={revealSoft}
            initial={reduce ? 'visible' : 'hidden'}
            animate="visible"
            transition={{ delay: 0.9 }}
            className="text-base sm:text-lg md:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed sm:leading-loose mb-10 sm:mb-12">
            منصة تعليمية متكاملة صُممت لطالبات الثانوية الحادية والعشرون، تعزّز الاستعداد
            لاختبار التحصيلي باختبارات تحاكي الاختبار الفعلي وتقارير أداء دقيقة بعد كل محاولة.
          </motion.p>

          <motion.div
            variants={reveal}
            initial={reduce ? 'visible' : 'hidden'}
            animate="visible"
            transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
            <MagneticButton className="w-full sm:w-auto">
              <Link
                to="/guest"
                className="group relative w-full inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-linear-to-l from-blue-600 via-indigo-600 to-violet-600 px-9 py-4 text-lg font-bold text-white shadow-xl shadow-indigo-700/30 ring-1 ring-white/10 transition-shadow hover:shadow-indigo-500/40">
                <span className="absolute inset-0 -translate-x-full bg-linear-to-l from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <HiOutlinePlay className="relative h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="relative">ابدأ الاختبار كضيف</span>
              </Link>
            </MagneticButton>
            <MagneticButton className="w-full sm:w-auto">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-9 py-4 text-lg font-bold text-white backdrop-blur transition-colors hover:border-gold-400/40 hover:bg-white/10">
                دخول الطالبات
              </Link>
            </MagneticButton>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="mt-10 sm:mt-14 text-sm text-slate-400">
            إعداد أ. ابتسام السلمي
            <span className="mx-2 text-slate-600">·</span>
            مديرة المدرسة / جميلة فهد المطيري
          </motion.p>
        </motion.div>

        {/* دعوة للتمرير */}
        <motion.a
          href="#stats"
          aria-label="انتقل للأسفل"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 hover:text-gold-300 transition-colors">
          <motion.span
            animate={reduce ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="block">
            <HiOutlineChevronDown className="h-6 w-6" />
          </motion.span>
        </motion.a>
      </header>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section id="stats" className="scroll-mt-24 px-4 sm:px-6 pb-20 sm:pb-28 -mt-6">
        <StatsStrip />
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="relative scroll-mt-24 px-4 sm:px-6 py-20 sm:py-28 border-y border-white/5 bg-ink-900/60">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(79_70_229/0.12),transparent)]" />
        <div className="max-w-7xl mx-auto">
          <SectionHeading eyebrow="لماذا منصة التحصيلي" title="كل ما تحتاجه الطالبة للاستعداد" />

          <motion.div
            variants={stagger(0.1, 0.09)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((feature) => (
              <SpotlightCard key={feature.title} className="group flex gap-4 sm:block p-5 sm:p-8">
                <motion.div
                  whileHover={reduce ? undefined : { rotate: -8, scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="flex-none flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl border border-gold-400/20 bg-gold-400/5 sm:mb-6 transition-colors group-hover:bg-gold-400/10 group-hover:border-gold-400/40">
                  <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-gold-300" />
                </motion.div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </SpotlightCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── شركاؤنا في النجاح ─────────────────────────────────────────── */}
      <PartnersSection />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-white/5 bg-ink-900/60 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent via-gold-400/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 text-center lg:text-start">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <img src="/logo.jpeg" alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-gold-400/30" />
            <div>
              <p className="font-display font-bold text-white text-lg">منصة التحصيلي</p>
              <p className="text-sm text-slate-400 mt-1">الثانوية الحادية والعشرون</p>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <a href="#features" className="hover:text-gold-200 transition-colors">مميزات المنصة</a>
            <a href="#partners" className="hover:text-gold-200 transition-colors">شركاؤنا في النجاح</a>
            <Link to="/guest" className="hover:text-gold-200 transition-colors">الاختبار كضيف</Link>
            <Link to="/login" className="hover:text-gold-200 transition-colors">تسجيل الدخول</Link>
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
      variants={stagger(0, 0.12)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className="text-center">
      <motion.p variants={revealSoft} className="text-sm font-semibold tracking-wide text-gold-300 mb-3">
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={revealSoft}
        className="font-display text-[1.75rem] leading-snug sm:text-4xl font-bold text-white">
        {title}
      </motion.h2>
      {/* الخط الذهبي يُرسم من المنتصف للطرفين عند الظهور */}
      <motion.div
        variants={{ hidden: { scaleX: 0, opacity: 0 }, visible: { scaleX: 1, opacity: 1, transition: { duration: 0.8, ease: EASE_OUT } } }}
        className="mx-auto mt-5 h-px w-28 bg-linear-to-l from-transparent via-gold-400 to-transparent"
      />
    </motion.div>
  );
}
