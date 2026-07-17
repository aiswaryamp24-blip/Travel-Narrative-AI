import { useRef, type MouseEvent } from 'react';
import type { FeedTripSummary } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Map } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SocialShareModal } from '@/components/social-share-modal';

/** Magnetic 3-D tilt: card leans toward wherever the cursor is */
function useCardTilt() {
  const ref = useRef<HTMLElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springCfg = { stiffness: 200, damping: 20, mass: 0.5 };
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]), springCfg);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-8, 8]), springCfg);
  const scale = useSpring(1, springCfg);
  const shadow = useSpring(0, springCfg);

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onMouseEnter = () => { scale.set(1.03); shadow.set(1); };
  const onMouseLeave = () => { rawX.set(0); rawY.set(0); scale.set(1); shadow.set(0); };

  const boxShadow = useTransform(shadow, [0, 1], [
    '0 2px 8px -4px rgb(0 0 0 / 0.1)',
    '0 24px 48px -12px rgb(0 0 0 / 0.28)',
  ]);

  return { ref, rotateX, rotateY, scale, boxShadow, onMouseMove, onMouseEnter, onMouseLeave };
}

export function TripCard({ trip }: { trip: FeedTripSummary }) {
  const tilt = useCardTilt();

  return (
    <motion.article
      ref={tilt.ref as React.RefObject<HTMLElement>}
      className="relative bg-card border border-border h-full flex flex-col"
      style={{
        transformPerspective: 900,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        scale: tilt.scale,
        boxShadow: tilt.boxShadow,
      }}
      onMouseMove={tilt.onMouseMove}
      onMouseEnter={tilt.onMouseEnter}
      onMouseLeave={tilt.onMouseLeave}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={`/trips/${trip.id}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted border-b border-border p-6 flex flex-col justify-end">
          {trip.coverObjectPath ? (
            <>
              <img
                src={`/api/storage${trip.coverObjectPath}`}
                alt={trip.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent">
              <Map className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
          )}
          <div className="relative z-10 space-y-2 text-white" style={{ transform: 'translateZ(20px)' }}>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase mb-4 opacity-80">
              <span>{format(new Date(trip.createdAt), 'MMM yyyy')}</span>
            </div>
            <h3 className="text-3xl font-serif leading-tight drop-shadow-md">{trip.title}</h3>
          </div>
        </div>
      </Link>
      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
        {trip.summary && (
          <p className="text-muted-foreground text-sm line-clamp-3 font-serif italic">"{trip.summary}"</p>
        )}
        <div className="flex items-center justify-between">
          <Link href={`/users/${trip.owner.id}`} className="flex items-center gap-2 group w-fit">
            <Avatar className="h-6 w-6 rounded-none border border-border">
              <AvatarImage src={trip.owner.avatarUrl ?? undefined} alt={trip.owner.displayName} className="rounded-none" />
              <AvatarFallback className="rounded-none text-xs font-serif">
                {trip.owner.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
              {trip.owner.displayName}
            </span>
          </Link>
          <SocialShareModal trip={trip} />
        </div>
      </div>
    </motion.article>
  );
}

export function TripGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      ))}
    </div>
  );
}
