import { useEffect, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { hasFinePointer } from './motion';

/**
 * خلفية الواجهة الرئيسية: شفق بطيء، شبكة خطوط تتلاشى، حُبيبات، وهالة ضوء
 * تتبع المؤشر على الحاسب. كلها خلف المحتوى ولا تستقبل أي نقر.
 */
export default function HeroBackground() {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(-1000);
  const rawY = useMotionValue(-1000);
  // نابض بطيء: الهالة تلحق المؤشر بتأخير بسيط بدل أن تلتصق به
  const x = useSpring(rawX, { stiffness: 60, damping: 20, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 60, damping: 20, mass: 0.6 });
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${x}px ${y}px, rgb(227 184 95 / 0.10), transparent 65%)`;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || !hasFinePointer()) return;
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      rawX.set(e.clientX - r.left);
      rawY.set(e.clientY - r.top);
    };
    const leave = () => {
      rawX.set(-1000);
      rawY.set(-1000);
    };
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, [reduce, rawX, rawY]);

  return (
    <div ref={ref} className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* الشفق */}
      <div className="aurora-blob -top-[20%] right-[5%] h-[34rem] w-[34rem] bg-aurora-indigo/35" />
      <div className="aurora-blob aurora-blob--2 top-[10%] -left-[10%] h-[28rem] w-[28rem] bg-aurora-violet/25" />
      <div className="aurora-blob aurora-blob--3 bottom-[-25%] left-[35%] h-[30rem] w-[30rem] bg-aurora-teal/20" />
      <div className="aurora-blob top-[30%] right-[-8%] h-[22rem] w-[22rem] bg-gold-500/12" style={{ animationDuration: '40s' }} />

      {/* الشبكة */}
      <div className="absolute inset-0 bg-grid-fade" />

      {/* هالة المؤشر (حاسب فقط) */}
      <motion.div className="absolute inset-0" style={{ background: spotlight }} />

      {/* تدرّج يُذيب الخلفية في لون الصفحة من الأسفل */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-ink-950 to-transparent" />

      {/* الحُبيبات */}
      <div className="grain absolute inset-0" />
    </div>
  );
}
