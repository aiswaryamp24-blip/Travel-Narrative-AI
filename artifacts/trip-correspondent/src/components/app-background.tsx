import { motion } from 'framer-motion';

/**
 * A persistent, very subtle ambient video loop behind the whole app —
 * visible because page shells use `bg-background/95` (slightly
 * translucent) rather than a fully opaque background, letting a hint of
 * this bleed through without hurting text readability anywhere.
 */
export function AppBackground() {
  return (
    <motion.div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2.5, ease: 'easeOut' }}
    >
      <video
        src="/app-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}
