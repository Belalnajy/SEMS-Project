import type { Variants } from 'framer-motion';

/** منحنى واحد لكل حركات الواجهة العامة — بداية سريعة ونهاية ناعمة */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const reveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE_OUT },
  },
};

export const revealSoft: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export const stagger = (delayChildren = 0, staggerChildren = 0.1): Variants => ({
  hidden: {},
  visible: { transition: { delayChildren, staggerChildren } },
});

/** يُظهر العنصر مرة واحدة عند دخوله مجال الرؤية */
export const inView = { once: true, margin: '-80px' } as const;

/** الحركات التي تتبع المؤشر لا معنى لها على اللمس */
export const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
