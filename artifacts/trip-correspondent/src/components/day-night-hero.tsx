import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Plane-window portal scroll hero.
 *
 * On load: a plane exterior fills the hero full-screen.
 * Scrolling drives a zoom anchored on one of the plane's windows.
 * As the zoom deepens, an expanding circular reveal (clip-path) grows from
 * that window position, showing the cobalt-grid scene that lives in the
 * section immediately below — reading as flying through the window rather
 * than hitting a hard cut when the pin releases.
 *
 * Three-layer stack (bottom → top):
 *   1. Cobalt grid scene  — always present, revealed through the portal
 *   2. Plane image        — scales toward the window (transform-origin pinned there)
 *   3. Cobalt reveal      — clip-path:circle() grows from window position
 *   4. Content            — headline / CTA, fades out early in the scroll
 *
 * prefers-reduced-motion → static hero; no scroll effects.
 */

const GRID_BG = [
  'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(99,102,241,0.06) 39px, rgba(99,102,241,0.06) 40px)',
  'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(99,102,241,0.06) 39px, rgba(99,102,241,0.06) 40px)',
].join(', ');

// Viewport-% position of the target window in the plane image.
// Tune these to match the actual generated image composition.
const WIN_X = 60; // % from left
const WIN_Y = 44; // % from top

export function DayNightHero({
  daySrc,
  nightSrc: _nightSrc, // kept for API compat; no longer used for crossfade
  children,
  scrollHeight = '280vh',
}: {
  daySrc: string;
  nightSrc: string;
  children: ReactNode;
  scrollHeight?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  /* ── 1. Plane image scale ──────────────────────────────────────────
     Zoom 1× → 7× anchored at the window position.
     At 7× the plane body is far off-screen; only the window area fills
     the viewport — the portal effect is complete even without the reveal. */
  const planeScale = useTransform(scrollYProgress, [0, 1], [1, 7]);

  /* ── 2. Cobalt reveal portal ───────────────────────────────────────
     A clip-path circle that starts at 0 % radius (invisible) and grows to
     200 % — far beyond the viewport — so the cobalt scene floods through.
     Delayed slightly vs the zoom so the zoom sensation lands first. */
  const revealRadius = useTransform(
    scrollYProgress,
    [0, 0.08, 0.78, 1],
    [0, 0, 160, 200],
  );
  const revealClip = useTransform(
    revealRadius,
    (r) => `circle(${r}% at ${WIN_X}% ${WIN_Y}%)`,
  );

  /* ── 3. Headline content ───────────────────────────────────────────
     Fades out and scales slightly as the viewer starts moving. */
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.22],
    [1, 1, 0],
  );
  const contentScale = useTransform(scrollYProgress, [0, 0.22], [1, 1.06]);

  /* ── Reduced-motion fallback ───────────────────────────────────────
     Static full-screen hero; no JavaScript scroll effects. */
  if (prefersReducedMotion) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <img
          src={daySrc}
          alt="Airplane exterior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    /* Scroll distance wrapper — the inner sticky view pins to the top
       and releases once this element has scrolled fully out of view. */
    <div ref={containerRef} className="relative" style={{ height: scrollHeight }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* ── Layer 1: indigo background (always visible beneath) ─── */}
        <div
          className="absolute inset-0"
          style={{ background: 'hsl(243 40% 97%)' }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundImage: GRID_BG }}
          />
        </div>

        {/* ── Layer 2: plane image — zoom toward the window ────────── */}
        <motion.div
          className="absolute inset-0"
          style={{
            scale: planeScale,
            transformOrigin: `${WIN_X}% ${WIN_Y}%`,
          }}
        >
          <img
            src={daySrc}
            alt="Airplane exterior"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </motion.div>

        {/* ── Layer 3: cobalt reveal — portal clip-path ────────────── */}
        {/* Same cobalt grid as Layer 1; clip-path grows from the window
            position, reading as "flying through" the window into the
            next section. Once radius reaches 200% this layer floods the
            entire viewport and the pin releases seamlessly. */}
        <motion.div
          className="absolute inset-0"
          style={{
            clipPath: revealClip,
            background: 'hsl(243 40% 97%)',
            willChange: 'clip-path',
          }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundImage: GRID_BG }}
          />
        </motion.div>

        {/* ── Layer 4: headline / CTA — fades early ────────────────── */}
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
