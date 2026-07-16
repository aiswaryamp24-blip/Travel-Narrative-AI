import { motion } from 'framer-motion';

function Y2KLoadingBar() {
  return (
    <div className="relative w-56 md:w-64 h-2 rounded-full overflow-hidden bg-white/15 border border-white/30 backdrop-blur-sm">
      <motion.div
        className="absolute inset-y-0 w-1/3 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(243 75% 65%), hsl(280 85% 78%), hsl(220 90% 72%), transparent)',
        }}
        animate={{ left: ['-40%', '107%'] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
      />
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
          className="w-44 md:w-56 drop-shadow-[0_0_30px_hsl(243_75%_60%/0.35)]"
        />
        <Y2KLoadingBar />
        <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.35em] text-foreground/60">
          Filing your stories
        </p>
      </div>
    </div>
  );
}
