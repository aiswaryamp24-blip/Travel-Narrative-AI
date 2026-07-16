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

function GlassBar({ durationMs = 1500 }: { durationMs?: number }) {
  const progress = useCountUp(durationMs);
  return (
    <div className="flex flex-col items-center gap-6 w-72 md:w-96">
      {/* Wordmark over video */}
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/60">turasum</p>
        <p className="font-mono text-3xl font-black tabular-nums text-white/90 mt-1">
          {progress}<span className="text-lg text-white/50">%</span>
        </p>
      </div>
      {/* Glass hairline progress track */}
      <div className="relative w-full">
        {/* Track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px bg-white/20" />
        {/* Lit fill */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-[2px] origin-left"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.85))',
            boxShadow: '0 0 8px 2px rgba(180,200,255,0.45)',
          }}
          transition={{ ease: 'linear', duration: 0.1 }}
        />
        {/* Caravan icons */}
        <div className="relative h-10">
          {CARAVAN.map(({ src, offset, bobDelay }) => (
            <motion.img
              key={src}
              src={src}
              alt=""
              className="absolute top-1/2 h-5 w-5 object-contain -translate-x-1/2 drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]"
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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end pb-16 overflow-hidden bg-black">
      {/* Main video — full screen, high quality */}
      <video
        src="/loading-main.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center center' }}
      />
      {/* Subtle bottom vignette so the progress bar reads cleanly */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
      />
      {/* Progress bar overlay */}
      <div className="relative z-10">
        <GlassBar durationMs={1500} />
      </div>
    </div>
  );
}
