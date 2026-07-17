import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

const PHOTO_W = 360; // px per frame
const GAP = 12; // px between frames
const REEL_HEIGHT = 290; // px

function FrameCounter({ count, total }: { count: MotionValue<number>; total: number }) {
  const [display, setDisplay] = useState(1);
  useEffect(() => count.on('change', (v) => setDisplay(Math.min(total, Math.max(1, Math.round(v))))), [count, total]);
  return (
    <span className="text-xs font-mono tabular-nums text-muted-foreground">
      {String(display).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </span>
  );
}

/**
 * Scroll-driven horizontal film reel: vertical page scroll moves the photo
 * strip sideways, like winding through a roll of film. A frame counter
 * in the corner ticks as each photo comes into focus — Sandra Creates style.
 */
export function FilmReel({
  photos,
}: {
  photos: { id: number; objectPath: string }[];
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start 85%', 'end 15%'],
  });

  const totalWidth = photos.length * (PHOTO_W + GAP) - GAP;
  const maxTranslate = -(totalWidth - PHOTO_W);
  const x = useTransform(scrollYProgress, [0, 1], [0, maxTranslate]);
  const frameMotion = useTransform(scrollYProgress, [0, 1], [1, photos.length]);

  if (photos.length === 0) return null;

  return (
    <div ref={outerRef} className="mt-16 pt-16 border-t border-border">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Selected Frames
        </span>
        <FrameCounter count={frameMotion} total={photos.length} />
      </div>

      {/* Clipped reel window */}
      <div className="overflow-hidden relative" style={{ height: REEL_HEIGHT }}>
        {/* Sprocket holes — decorative filmstrip feel */}
        <div className="absolute top-2 bottom-2 left-0 z-10 flex flex-col justify-around pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-sm bg-background border border-border/60" />
          ))}
        </div>
        <div className="absolute top-2 bottom-2 right-0 z-10 flex flex-col justify-around pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-sm bg-background border border-border/60" />
          ))}
        </div>

        <motion.div className="flex h-full pl-6 pr-6" style={{ x, gap: GAP }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="h-full overflow-hidden shrink-0"
              style={{ width: PHOTO_W }}
            >
              <img
                src={`/api/storage${photo.objectPath}`}
                alt="Trip photograph"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
