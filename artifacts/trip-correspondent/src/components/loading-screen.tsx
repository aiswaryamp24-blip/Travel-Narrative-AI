import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/** Counts 0 -> 100 over `durationMs`, driving both the percentage readout
 * and the progress-track marker — matches the splash's real display
 * duration (see App.tsx's useShowSplash) rather than an arbitrary pace. */
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

/** Trailing caravan riding the progress track — each icon lags the readout
 * percentage by a fixed offset (so they arrive staggered, not stacked) and
 * bobs slightly out of phase with the others for a lively, non-uniform feel. */
const CARAVAN = [
  { src: '/icon-plane.png', offset: 0, bobDelay: 0 },
  { src: '/icon-train.png', offset: 9, bobDelay: 0.2 },
  { src: '/icon-bike.png', offset: 18, bobDelay: 0.4 },
];

function TurasumLoadingCard({ durationMs = 1500 }: { durationMs?: number }) {
  const progress = useCountUp(durationMs);

  return (
    <div className="w-72 md:w-80 rounded-3xl bg-card/30 backdrop-blur-xl border border-white/40 shadow-xl px-6 py-5 space-y-5">
      <div className="text-center font-y2k text-xs uppercase tracking-[0.3em] text-muted-foreground">
        turasum
      </div>

      <div className="text-right text-3xl md:text-4xl font-y2k font-black text-primary tabular-nums">
        {progress}%
      </div>

      <div className="relative h-8">
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, hsl(var(--muted-foreground)) 0, hsl(var(--muted-foreground)) 2px, transparent 2px, transparent 7px)',
            opacity: 0.4,
          }}
        />
        {CARAVAN.map(({ src, offset, bobDelay }) => (
          <motion.img
            key={src}
            src={src}
            alt=""
            className="absolute top-1/2 h-5 w-5 md:h-6 md:w-6 object-contain -translate-x-1/2"
            animate={{
              left: `${Math.max(0, progress - offset)}%`,
              y: ['-50%', 'calc(-50% - 3px)', '-50%'],
            }}
            transition={{
              left: { ease: 'linear', duration: 0.1 },
              y: { duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: bobDelay },
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Full-screen splash shown briefly on initial app load. Deliberately not
 * wired to any real loading signal (Clerk auth resolution, data fetches)
 * since this app's exact Clerk wrapper API couldn't be verified in this
 * environment — a fixed-duration overlay (see App.tsx) is a safer bet than
 * gating on an unconfirmed API and risking a broken build.
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end pb-4 md:pb-6 overflow-hidden bg-background">
      <img src="/loading-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <video
        src="/loading-fox-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <TurasumLoadingCard durationMs={1500} />
      </div>
    </div>
  );
}
