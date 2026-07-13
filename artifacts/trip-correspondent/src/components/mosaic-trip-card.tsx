import { useRef, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Map, AlertCircle, Calendar } from 'lucide-react';
import type { TripSummary } from '@workspace/api-client-react';

/** Grid-span classes for one position in the repeating 5-tile mosaic
 * rhythm — mixed sizes (big hero / tall / short / short / tall), matching
 * an asymmetric editorial grid rather than a uniform card grid. Mobile
 * always gets a plain single column — an asymmetric mosaic reads as
 * chaotic rather than deliberate at phone width. */
const MOSAIC_PATTERN = [
  'md:col-span-4 md:row-span-2',
  'md:col-span-2 md:row-span-2',
  'md:col-span-2 md:row-span-1',
  'md:col-span-2 md:row-span-1',
  'md:col-span-2 md:row-span-2',
];

export function mosaicSpanClass(index: number): string {
  return MOSAIC_PATTERN[index % MOSAIC_PATTERN.length];
}

/** Tracks the cursor's position over the card and tilts it in 3D toward
 * the pointer (rather than a single fixed hover pose), sprung for a
 * smooth, weighty feel rather than snapping directly to the cursor. */
function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-8, 8]), springConfig);
  const scale = useSpring(1, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseEnter = () => scale.set(1.02);
  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
    scale.set(1);
  };

  return { ref, rotateX, rotateY, scale, handleMouseMove, handleMouseEnter, handleMouseLeave };
}

export function MosaicTripCard({ trip, index }: { trip: TripSummary; index: number }) {
  const { ref, rotateX, rotateY, scale, handleMouseMove, handleMouseEnter, handleMouseLeave } = useCardTilt();

  return (
    <motion.div
      ref={ref}
      className={mosaicSpanClass(index)}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/trips/${trip.id}`} className="group block h-full">
        <motion.article
          style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
          className="relative bg-card border border-border h-full min-h-[220px] flex flex-col justify-end overflow-hidden"
        >
          {trip.coverObjectPath ? (
            <>
              <img
                src={`/api/storage${trip.coverObjectPath}`}
                alt={trip.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent">
              <Map className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
          )}

          <div className="relative z-10 p-6 space-y-2 text-white" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase opacity-80">
              <span>{format(new Date(trip.createdAt), 'MMM yyyy')}</span>
              {trip.startDate && trip.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(trip.startDate), 'MMM d')}&ndash;{format(new Date(trip.endDate), 'd')}
                </span>
              )}
            </div>
            <h3 className="text-2xl md:text-3xl font-serif leading-tight drop-shadow-md">{trip.title}</h3>
            {trip.summary && (
              <p className="text-white/80 text-sm font-serif italic line-clamp-2 max-w-md">"{trip.summary}"</p>
            )}
          </div>

          {(trip.status === 'pending' || trip.status === 'processing') && (
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest px-3 py-1 animate-pulse">
              Writing
            </div>
          )}
          {trip.status === 'error' && (
            <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground text-xs font-mono uppercase tracking-widest px-3 py-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Error
            </div>
          )}
        </motion.article>
      </Link>
    </motion.div>
  );
}
