import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const GRID_BACKGROUND_IMAGE = [
  'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,120,255,0.10) 39px, rgba(0,120,255,0.10) 40px)',
  'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,120,255,0.10) 39px, rgba(0,120,255,0.10) 40px)',
].join(', ');

/**
 * Pinned hero combining both sandracreates.com techniques: the background
 * dives into the shot (scale driven directly by scroll progress, the core
 * "zoom" sensation from her hero) while simultaneously crossfading a
 * daytime keyframe into a night keyframe. Works with a single image alone
 * (pass the same src for both) — the zoom still reads fully, the crossfade
 * just becomes a no-op until a real day/night pair is available.
 *
 * The zoom continues past the crossfade into a third stage: the window
 * shot dissolves into the same electric-cobalt grid-line wash used by the
 * section immediately below (see landing.tsx), so scrolling all the way
 * through reads as flying through the window into that scene rather than
 * hitting a hard cut when the pin releases.
 *
 * The wrapper's height defines how much scroll the whole effect takes; the
 * inner view stays pinned full-screen throughout, releasing back to normal
 * document flow once the wrapper's scroll range is exhausted.
 */
export function DayNightHero({
  daySrc,
  nightSrc,
  children,
  scrollHeight = '260vh',
}: {
  daySrc: string;
  nightSrc: string;
  children: ReactNode;
  scrollHeight?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 2.6]);
  const nightOpacity = useTransform(scrollYProgress, [0, 0.55], [0, 1]);
  const windowFade = useTransform(scrollYProgress, [0.62, 0.92], [1, 0]);
  const gridOpacity = useTransform(scrollYProgress, [0.62, 0.92], [0, 1]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.15, 0.45, 0.6], [1, 1, 1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 0.45], [1, 1.06]);

  return (
    <div ref={containerRef} className="relative" style={{ height: scrollHeight }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: mediaScale, opacity: windowFade }}>
          <img src={daySrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <motion.img
            src={nightSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: nightOpacity }}
          />
        </motion.div>

        {/* Third stage: dissolves into the blue grid-line scene the next
            section already uses, so the zoom feels continuous. */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: gridOpacity, background: 'hsl(213 70% 8%)' }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: GRID_BACKGROUND_IMAGE }} />
        </motion.div>

        <motion.div
          className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
          style={{ opacity: contentOpacity, scale: contentScale }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
