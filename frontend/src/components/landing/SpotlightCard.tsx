import { useRef, type ReactNode, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { reveal } from './motion';

/**
 * بطاقة بهالة ضوء تتبع المؤشر وحدّ ذهبي يدور عند التمرير.
 * موضع الهالة يُكتب في متغيّرات CSS مباشرة بلا إعادة رسم React.
 */
export default function SpotlightCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || frame.current !== null) return;
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${clientX - r.left}px`);
      el.style.setProperty('--my', `${clientY - r.top}px`);
    });
  };

  return (
    <motion.div
      ref={ref}
      variants={reveal}
      onMouseMove={onMove}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`spotlight-card border-conic rounded-3xl border border-white/8 bg-white/[0.025] ${className}`}>
      {children}
    </motion.div>
  );
}
