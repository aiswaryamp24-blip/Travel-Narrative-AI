import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function useCountUp(durationMs: number) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const pct = Math.min(100, Math.round(((now - start) / durationMs) * 100));
      setProgress(pct);
      if (pct < 100) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs]);
  return progress;
}

const CARAVAN = [
  { src: '/icon-plane.png', offset: 0, bobDelay: 0 },
  { src: '/icon-train.png', offset: 9, bobDelay: 0.2 },
  { src: '/icon-bike.png', offset: 18, bobDelay: 0.4 },
];

function GlassProgressBar({ durationMs = 1500 }: { durationMs?: number }) {
  const progress = useCountUp(durationMs);

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* Large logo mark */}
      <div className="flex flex-col items-center gap-3">
        <img
          src="/fox-logo.png"
          alt="Turasum"
          className="h-20 w-20 object-contain"
          style={{
            filter: 'drop-shadow(0 0 16px hsl(243 75% 55% / 0.7)) drop-shadow(0 0 6px hsl(243 75% 55% / 0.9))',
          }}
        />
        <span
          className="text-xs font-mono uppercase tracking-[0.45em] text-primary/80"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          turasum
        </span>
      </div>

      {/* Percentage readout */}
      <span
        className="text-5xl font-black tabular-nums"
        style={{
          fontFamily: "'Space Grotesk', serif",
          color: 'hsl(var(--foreground))',
          letterSpacing: '-0.04em',
        }}
      >
        {progress}<span className="text-2xl text-muted-foreground">%</span>
      </span>

      {/* Glass progress track — no box, just the line */}
      <div className="relative w-80 md:w-[420px]">
        {/* Track: frosted glass hairline */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[1px]"
          style={{ background: 'hsl(var(--border))' }}
        />
        {/* Glass fill bar */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-[2px] origin-left"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--primary)))',
            boxShadow: '0 0 8px 1px hsl(var(--primary) / 0.4)',
          }}
          transition={{ ease: 'linear', duration: 0.1 }}
        />
        {/* Travel icons riding the track */}
        <div className="relative h-9">
          {CARAVAN.map(({ src, offset, bobDelay }) => (
            <motion.img
              key={src}
              src={src}
              alt=""
              className="absolute top-1/2 h-5 w-5 object-contain -translate-x-1/2"
              animate={{
                left: `${Math.max(0, progress - offset)}%`,
                y: ['-50%', 'calc(-50% - 4px)', '-50%'],
              }}
              transition={{
                left: { ease: 'linear', duration: 0.1 },
                y: { duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: bobDelay },
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Subtle indigo aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse 70% 55% at 20% 15%, hsl(243 75% 55% / 0.12) 0%, transparent 65%)',
              'radial-gradient(ellipse 55% 45% at 80% 80%, hsl(260 70% 60% / 0.10) 0%, transparent 60%)',
              'radial-gradient(ellipse 40% 60% at 55% 40%, hsl(243 60% 65% / 0.07) 0%, transparent 50%)',
            ].join(', '),
          }}
        />
      </div>
      <div className="relative z-10">
        <GlassProgressBar durationMs={1500} />
      </div>
    </div>
  );
}
