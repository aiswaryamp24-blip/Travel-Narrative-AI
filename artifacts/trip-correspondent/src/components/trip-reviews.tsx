import { useState, useRef, useCallback, useEffect } from 'react';
import { Bike, Train, Car, Bus, PlaneTakeoff } from 'lucide-react';

const ICONS = [
  { icon: Bike,         label: 'Needs the SOS button',   alt: 'bike' },
  { icon: Train,        label: 'Bumpy road ahead',        alt: 'train' },
  { icon: Car,          label: 'Smooth sailing',          alt: 'car' },
  { icon: Bus,          label: 'First class all the way', alt: 'bus' },
  { icon: PlaneTakeoff, label: 'Cleared for takeoff 🌟',  alt: 'plane', gold: true },
] as const;

function useStoredRating(tripId: number) {
  const key = `trip-rating-${tripId}`;
  const [rating, setRatingState] = useState<number | null>(() => {
    try { const v = localStorage.getItem(key); return v ? Number(v) : null; } catch { return null; }
  });
  const setRating = (r: number) => {
    setRatingState(r);
    try { localStorage.setItem(key, String(r)); } catch { /* ignore */ }
  };
  return [rating, setRating] as const;
}

export function TripReviews({ tripId }: { tripId: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useStoredRating(tripId);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const ratingFromX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 1;
    const { left, width } = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - left) / width));
    return Math.max(1, Math.min(5, Math.round(pct * 4 + 1)));
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setRating(ratingFromX(e.clientX));
  }, [dragging, ratingFromX, setRating]);

  const onMouseUp = useCallback(() => setDragging(false), []);
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    if (t) setRating(ratingFromX(t.clientX));
  }, [dragging, ratingFromX, setRating]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [onMouseMove, onMouseUp, onTouchMove]);

  const active = hovered ?? rating;

  return (
    <section className="py-20 px-6 max-w-3xl mx-auto text-center select-none">
      <div className="border border-border bg-card p-10 space-y-10">
        {/* Header */}
        <div>
          <div className="h-[2px] w-10 bg-primary mx-auto mb-6" />
          <h3 className="font-serif text-3xl font-black">Rate this story</h3>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mt-2">
            Drag the scale · Your rating is saved locally
          </p>
        </div>

        {/* Icon row */}
        <div className="flex items-end justify-between gap-2 px-2">
          {ICONS.map((icon, i) => {
            const val = i + 1;
            const isActive = active !== null && val <= active;
            const isCurrent = active === val;
            return (
              <button
                key={val}
                type="button"
                aria-label={`Rate ${val} — ${icon.label}`}
                className="flex flex-col items-center gap-2 focus:outline-none transition-all duration-200 cursor-pointer"
                style={{
                  transform: isCurrent ? 'scale(1.35) translateY(-6px)' : isActive ? 'scale(1.1)' : 'scale(0.85)',
                  opacity: isActive ? 1 : 0.35,
                }}
                onMouseEnter={() => setHovered(val)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setRating(val)}
              >
                <icon.icon
                  className="w-10 h-10"
                  style={{
                    color: ('gold' in icon && icon.gold) && isActive
                      ? 'rgb(251,191,36)'
                      : isActive
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted-foreground))',
                    filter: ('gold' in icon && icon.gold) && isActive
                      ? 'drop-shadow(0 0 8px rgba(251,191,36,0.6))'
                      : isActive
                      ? 'drop-shadow(0 0 6px rgba(99,102,241,0.5))'
                      : undefined,
                    strokeWidth: 1.5,
                  }}
                />
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {val}
                </span>
              </button>
            );
          })}
        </div>

        {/* Drag track */}
        <div
          ref={trackRef}
          className="relative h-3 mx-2 cursor-pointer touch-none"
          onMouseDown={(e) => { setDragging(true); setRating(ratingFromX(e.clientX)); }}
          onTouchStart={(e) => { const t = e.touches[0]; if (t) { setDragging(true); setRating(ratingFromX(t.clientX)); }}}
        >
          {/* Base track */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            <div className="w-full h-px bg-border relative">
              {/* Tick marks at each stop */}
              {[0, 25, 50, 75, 100].map(pct => (
                <div
                  key={pct}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2 w-px bg-border"
                  style={{ left: `${pct}%` }}
                />
              ))}
              {/* Filled portion */}
              {rating !== null && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary transition-all duration-150"
                  style={{ width: `${((rating - 1) / 4) * 100}%` }}
                />
              )}
            </div>
          </div>
          {/* Handle */}
          {rating !== null && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-primary border-2 border-primary-foreground shadow-lg shadow-primary/40 transition-left duration-150 cursor-grab active:cursor-grabbing"
              style={{ left: `${((rating - 1) / 4) * 100}%` }}
            />
          )}
        </div>

        {/* Current label */}
        <div className="h-8 flex items-center justify-center">
          {active !== null ? (
            <p
              key={active}
              className="font-serif text-lg font-black text-foreground animate-in fade-in duration-200"
            >
              {ICONS[active - 1]?.label}
            </p>
          ) : (
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              Drag to rate
            </p>
          )}
        </div>

        {rating !== null && (
          <p className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">
            Rating saved · click any icon to change
          </p>
        )}
      </div>
    </section>
  );
}
