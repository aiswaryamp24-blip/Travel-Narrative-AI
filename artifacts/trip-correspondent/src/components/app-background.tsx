import { motion } from 'framer-motion';

/**
 * A persistent, very subtle background image behind the whole app —
 * visible because page shells use `bg-background/95` (slightly
 * translucent) rather than a fully opaque background, letting a hint of
 * this bleed through without hurting text readability anywhere.
 */
export function AppBackground() {
  return (
    <motion.div
      className="fixed inset-0 -z-10 pointer-events-none bg-cover bg-center"
      style={{ backgroundImage: 'url(/app-bg.png)' }}
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2.5, ease: 'easeOut' }}
    />
  );
}
