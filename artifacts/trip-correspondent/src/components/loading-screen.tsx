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

function TurasumLoadingCard({ durationMs = 1500 }: { durationMs?: number }) {
  const progress = useCountUp(durationMs);

  return (
    <div className="w-72 md:w-80 rounded-3xl bg-card/80 backdrop-blur-md border border-border shadow-xl px-6 py-5 space-y-5">
      <div className="text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
        turasum
      </div>

      <div className="flex items-center justify-between">
        <motion.img
          src="/icon-plane.png"
          alt=""
          className="h-10 w-10 md:h-12 md:w-12 object-contain"
          animate={{ y: [0, -3, 0], rotate: [-6, -10, -6] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="text-3xl md:text-4xl font-serif font-black text-primary tabular-nums">
          {progress}%
        </div>
      </div>

      <div className="relative h-4">
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, hsl(var(--muted-foreground)) 0, hsl(var(--muted-foreground)) 2px, transparent 2px, transparent 7px)',
            opacity: 0.4,
          }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-[2px] bg-primary rounded-full"
          animate={{ left: `${progress}%` }}
          transition={{ ease: 'linear', duration: 0.1 }}
        />
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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background">
      <img src="/loading-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <video
          src="/loading-fox-reveal.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-40 md:w-48 drop-shadow-[0_0_30px_hsl(243_75%_60%/0.35)]"
        />
        <TurasumLoadingCard durationMs={1500} />
      </div>
    </div>
  );
}
