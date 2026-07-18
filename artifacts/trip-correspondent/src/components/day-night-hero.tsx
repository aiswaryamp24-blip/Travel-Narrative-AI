import { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, useAnimationFrame, useMotionValue } from 'framer-motion';
import type { StripItem } from './scroll-velocity-strip';

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
 * Four-layer stack (bottom → top):
 *   1. Cobalt grid scene  — always present, revealed through the portal
 *   2. Plane image        — scales toward the window (transform-origin pinned there)
 *   3. Cobalt reveal      — clip-path:circle() grows from window position,
 *                           contains a live trip-preview strip + destination names
 *   4. Content            — headline / CTA, fades out early in the scroll
 *
 * prefers-reduced-motion → static hero; no scroll effects.
 */

const GRID_BG = [
  'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(99,102,241,0.06) 39px, rgba(99,102,241,0.06) 40px)',
  'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(99,102,241,0.06) 39px, rgba(99,102,241,0.06) 40px)',
].join(', ');

// Default viewport-% position of the oval window in the interior cabin image.
// Window is centred in the frame and sits in the upper half.
const DEFAULT_WIN_X = 50; // % from left
const DEFAULT_WIN_Y = 40; // % from top

// Curated sample shown when no real trips are available.
// Solid-color thumbnails paired with evocative destination names.
const SAMPLE_PORTAL_ITEMS: StripItem[] = [
  { id: 'sample-1', src: '', label: 'Kyoto, Japan' },
  { id: 'sample-2', src: '', label: 'Patagonia, Argentina' },
  { id: 'sample-3', src: '', label: 'Santorini, Greece' },
  { id: 'sample-4', src: '', label: 'Marrakech, Morocco' },
  { id: 'sample-5', src: '', label: 'Reykjavik, Iceland' },
];

// Hues for sample cards when no photo is available
const SAMPLE_HUES = [230, 180, 20, 10, 200];

/** Auto-drifting strip used inside the portal reveal. No velocity coupling needed — it
 *  animates at a constant pace independently of scroll. */
function PortalStrip({ items }: { items: StripItem[] }) {
  const baseX = useMotionValue(0);
  const SPEED = -28; // px/s

  useAnimationFrame((_, delta) => {
    baseX.set(baseX.get() + SPEED * (delta / 1000));
  });

  // Wrap: seamlessly loop between -50% and 0%
  const x = useTransform(baseX, (v) => {
    const range = 50;
    const mod = ((((-v) % range) + range) % range);
    return `-${mod}%`;
  });

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden w-full">
      <motion.div className="flex gap-3 w-fit" style={{ x }}>
        {doubled.map((item, i) => {
          const sampleHue = SAMPLE_HUES[i % SAMPLE_HUES.length];
          return (
            <div
              key={`${item.id}-${i}`}
              className="relative shrink-0 overflow-hidden"
              style={{ width: 160, height: 200, borderRadius: 4 }}
            >
              {item.src ? (
                <img
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, hsl(${sampleHue} 45% 30%), hsl(${sampleHue + 30} 55% 20%))`,
                  }}
                />
              )}
              {/* gradient overlay + label */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 40%, transparent 80%)' }}
              />
              <span
                className="absolute bottom-0 left-0 right-0 px-3 py-2 font-serif italic text-white leading-tight"
                style={{ fontSize: 12 }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

/** Cycles through destination names with a crossfade every 2.2 s. */
function DestinationCycler({ labels }: { labels: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (labels.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % labels.length), 2200);
    return () => clearInterval(id);
  }, [labels.length]);

  return (
    <div className="relative h-8 overflow-hidden flex items-center justify-center">
      {labels.map((label, i) => (
        <motion.span
          key={label}
          className="absolute font-mono text-[10px] uppercase tracking-[0.35em] text-indigo-300/80 whitespace-nowrap"
          initial={{ opacity: 0, y: 6 }}
          animate={i === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        >
          {label}
        </motion.span>
      ))}
    </div>
  );
}

/** Content shown inside the expanding portal circle once it's large enough. */
function PortalContent({ items }: { items: StripItem[] }) {
  const labels = items.map((it) => it.label);
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <DestinationCycler labels={labels} />
      <PortalStrip items={items} />
      <div
        className="font-serif italic text-indigo-300/60 text-[11px] tracking-wide"
        style={{ marginTop: 2 }}
      >
        stories from every corner
      </div>
    </div>
  );
}

export function DayNightHero({
  daySrc,
  daySrcSet,
  nightSrc: _nightSrc, // kept for API compat; no longer used for crossfade
  children,
  portalItems,
  scrollHeight = '280vh',
  windowX = DEFAULT_WIN_X,
  windowY = DEFAULT_WIN_Y,
}: {
  daySrc: string;
  /** Optional srcset for responsive image loading. */
  daySrcSet?: string;
  nightSrc: string;
  children: ReactNode;
  /** Real trip strip items from discoverFeed; falls back to curated samples. */
  portalItems?: StripItem[];
  scrollHeight?: string;
  /**
   * Horizontal anchor of the plane window, as a percentage (0–100) from the
   * left edge of the image. Used to aim the zoom and the clip-path reveal.
   * When the hero image is swapped, pass the correct value here so the portal
   * zooms into the right spot without touching the animation logic.
   * Defaults to the position in the stock `window-interior.jpg` composition.
   */
  windowX?: number;
  /**
   * Vertical anchor of the plane window, as a percentage (0–100) from the
   * top edge of the image. See `windowX` for full explanation.
   * Defaults to the position in the stock `window-interior.jpg` composition.
   */
  windowY?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const effectiveItems =
    portalItems && portalItems.length >= 2 ? portalItems : SAMPLE_PORTAL_ITEMS;

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
    (r) => `circle(${r}% at ${windowX}% ${windowY}%)`,
  );

  /* ── 3. Portal content fade-in ─────────────────────────────────────
     Content appears only after the portal radius reaches ~30% (readable).
     radius=30% corresponds to scrollYProgress ≈ 0.21 (linear interp of
     the [0.08,0.78]→[0,160] segment). Add a small lag for comfort. */
  const portalContentOpacity = useTransform(
    scrollYProgress,
    [0.22, 0.38],
    [0, 1],
  );

  /* ── 4. Headline content ───────────────────────────────────────────
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
          srcSet={daySrcSet}
          sizes="100vw"
          alt="Airplane exterior"
          fetchPriority="high"
          loading="eager"
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
            transformOrigin: `${windowX}% ${windowY}%`,
          }}
        >
          <img
            src={daySrc}
            srcSet={daySrcSet}
            sizes="100vw"
            alt="Airplane exterior"
            fetchPriority="high"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </motion.div>

        {/* ── Layer 3: cobalt reveal — portal clip-path ────────────── */}
        {/* Same cobalt grid as Layer 1; clip-path grows from the window
            position, reading as "flying through" the window into the
            next section. Once radius reaches 200% this layer floods the
            entire viewport and the pin releases seamlessly.
            The portal content (photo strip + destination names) layers
            over the grid inside this circle. */}
        <motion.div
          className="absolute inset-0"
          style={{
            clipPath: revealClip,
            background: 'hsl(243 40% 97%)',
            willChange: 'clip-path',
          }}
        >
          {/* Grid base */}
          <div
            className="absolute inset-0"
            style={{ backgroundImage: GRID_BG }}
          />

          {/* Portal content — fades in when circle is large enough to read */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            style={{ opacity: portalContentOpacity }}
            aria-hidden="true"
          >
            <PortalContent items={effectiveItems} />
          </motion.div>
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
