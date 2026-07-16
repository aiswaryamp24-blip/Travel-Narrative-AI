import { motion } from 'framer-motion';

interface Sparkle {
  top: string;
  left: string;
  size: number;
  delay: number;
  duration: number;
}

const SPARKLES: Sparkle[] = [
  { top: '8%', left: '4%', size: 14, delay: 0, duration: 2.4 },
  { top: '75%', left: '-3%', size: 10, delay: 0.6, duration: 2.8 },
  { top: '-6%', left: '55%', size: 12, delay: 1.1, duration: 2.2 },
  { top: '20%', left: '102%', size: 16, delay: 0.3, duration: 3 },
  { top: '85%', left: '92%', size: 9, delay: 1.5, duration: 2.5 },
];

function SparkleMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * A handful of twinkling sparkle marks scattered around whatever they wrap
 * (the hero logo/heading), each independently fading and scaling in and out
 * on its own offset loop plus a soft ambient glow pulse behind the content —
 * kept as a thin absolute-positioned overlay so it never affects layout.
 */
export function SparkleGlow({
  children,
  className = '',
  color = 'text-white',
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      <motion.span
        className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
        style={{ background: 'radial-gradient(circle, hsl(210 100% 75% / 0.55) 0%, transparent 70%)' }}
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.92, 1.08, 0.92] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {children}
      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          className={`pointer-events-none absolute ${color}`}
          style={{ top: s.top, left: s.left }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.3], rotate: [0, 25] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <SparkleMark size={s.size} />
        </motion.span>
      ))}
    </span>
  );
}
