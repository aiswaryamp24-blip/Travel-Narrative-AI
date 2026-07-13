import { motion } from 'framer-motion';

/**
 * Indigo neo-Y2K background treatment: soft, slowly-drifting gradient
 * "aurora" blobs behind hero content, plus a faint holographic sheen
 * sweep — the glossy/gradient-mesh look associated with that aesthetic,
 * kept subtle and contained to hero moments rather than applied
 * site-wide, so it doesn't fight the sharp editorial grid everywhere else.
 */
export function HeroGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute -top-1/3 -left-1/4 h-[60vw] w-[60vw] max-h-[600px] max-w-[600px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(243 75% 60%) 0%, transparent 70%)' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/3 -right-1/4 h-[55vw] w-[55vw] max-h-[560px] max-w-[560px] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(270 80% 65%) 0%, transparent 70%)' }}
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 right-1/3 h-[30vw] w-[30vw] max-h-[320px] max-w-[320px] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(210 90% 65%) 0%, transparent 70%)' }}
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/** Glossy chrome/holographic gradient text — for hero display type only. */
export function ChromeText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(115deg, hsl(243 70% 55%) 10%, hsl(280 85% 75%) 35%, hsl(220 90% 70%) 55%, hsl(243 70% 55%) 80%)',
      }}
    >
      {children}
    </span>
  );
}
