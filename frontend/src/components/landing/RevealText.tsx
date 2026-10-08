import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from './motion';

/**
 * يكشف النص كلمةً كلمة: كل كلمة تصعد من تحت قناع مع إزالة الضبابية.
 * التقسيم على المسافات فقط، فلا يتأثر وصل الحروف العربية داخل الكلمة.
 */
export default function RevealText({
  text,
  className = '',
  wordClassName = '',
  delay = 0,
  as: Tag = 'span',
}: {
  text: string;
  className?: string;
  /**
   * أصناف تُطبَّق على كل كلمة متحركة لا على الحاوية — ضروري لتدرّج النص
   * (background-clip: text) لأن الكلمة المتحركة طبقة مستقلة تخرج من قناع الأب.
   */
  wordClassName?: string;
  delay?: number;
  as?: 'span' | 'h1' | 'h2' | 'p';
}) {
  const reduce = useReducedMotion();
  const words = text.split(' ');

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className={`inline-block will-change-transform ${wordClassName}`}
            initial={reduce ? false : { y: '110%', opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: delay + i * 0.07 }}>
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  );
}
