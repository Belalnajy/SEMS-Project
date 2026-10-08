import { useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { hasFinePointer } from './motion';

/**
 * زرّ "مغناطيسي": ينجذب قليلاً نحو المؤشر وهو فوقه ويرتدّ بنعومة عند الخروج.
 * على اللمس أو مع تقليل الحركة يتصرّف كزرّ عادي.
 */
export default function MagneticButton({
  children,
  className = '',
  strength = 0.22,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 });
  const active = !reduce && hasFinePointer();

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-flex ${className}`}>
      {children}
    </motion.div>
  );
}
