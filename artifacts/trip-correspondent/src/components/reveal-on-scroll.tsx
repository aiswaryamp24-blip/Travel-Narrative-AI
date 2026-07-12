import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Fades/slides/tilts content in once it scrolls into view, using Framer
 * Motion's viewport trigger — gives the magazine-spread trip page editorial
 * motion instead of every section just appearing instantly (which is
 * invisible for anything below the fold on a plain mount-triggered
 * animation). The slight rotateX gives it a touch of depth rather than a
 * flat fade.
 */
export function RevealOnScroll({
  children,
  className = '',
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: 6 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: delayMs / 1000, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
