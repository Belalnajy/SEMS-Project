import { motion, useScroll, useSpring } from 'framer-motion';

/** خطّ ذهبي رفيع أعلى الصفحة يعكس تقدّم القراءة */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 inset-x-0 z-[60] h-0.5 origin-right bg-linear-to-l from-gold-300 via-gold-400 to-gold-500 shadow-[0_0_12px_rgb(227_184_95/0.6)]"
    />
  );
}
