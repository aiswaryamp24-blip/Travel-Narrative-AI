/**
 * TravelMotionBg — replaces the old Three.js cube grid.
 * Pure CSS keyframe animations — no WebGL, works in every environment.
 * Exported as ThreeCubeBg so all existing imports stay unchanged.
 */

const CSS = `
@keyframes trvl-ltr {
  from { transform: translateX(-120px); }
  to   { transform: translateX(calc(100vw + 200px)); }
}
@keyframes trvl-rtl {
  from { transform: translateX(calc(100vw + 200px)); }
  to   { transform: translateX(-120px); }
}
@keyframes trvl-plane-ltr {
  from { transform: translate(-120px,  55px); }
  to   { transform: translate(calc(100vw + 200px), -65px); }
}
@keyframes trvl-plane-rtl {
  from { transform: translate(calc(100vw + 200px), -55px); }
  to   { transform: translate(-120px,  65px); }
}
`;

/* ── Inline SVG icons ──────────────────────────────────────────────── */
function BusSVG({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 88 56" fill="none" style={style}>
      {/* Body */}
      <rect x="4" y="8" width="80" height="36" rx="7" stroke="currentColor" strokeWidth="3" />
      {/* Roof band */}
      <rect x="4" y="8" width="80" height="18" rx="6" stroke="currentColor" strokeWidth="2" />
      {/* Windows */}
      <rect x="12" y="12" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="37" y="12" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="62" y="12" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      {/* Door */}
      <rect x="37" y="28" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="2" />
      {/* Wheels */}
      <circle cx="22" cy="49" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="66" cy="49" r="7" stroke="currentColor" strokeWidth="2.5" />
      {/* Destination board */}
      <rect x="12" y="28" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function WalkerSVG({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 44 72" fill="none" style={style}>
      {/* Head */}
      <circle cx="22" cy="9" r="7" stroke="currentColor" strokeWidth="2.5" />
      {/* Body */}
      <path d="M22 16 Q19 25 18 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Arm left */}
      <path d="M20 22 Q12 29 8 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arm right */}
      <path d="M20 21 Q28 25 34 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Leg left */}
      <path d="M18 36 Q14 50 10 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Leg right */}
      <path d="M18 36 Q24 50 30 60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Feet */}
      <path d="M10 62 L4 64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 60 L36 63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Vehicle definitions ────────────────────────────────────────────── */
interface Vehicle {
  kind: 'plane' | 'train' | 'car' | 'bike' | 'bus' | 'walker';
  size: number;        // px width
  top: number;         // % from top
  duration: number;    // seconds for one pass
  delay: number;       // seconds (negative = pre-started)
  direction: 'ltr' | 'rtl';
  opacity: number;
}

const VEHICLES: Vehicle[] = [
  // Large plane — flies across top, slight climb
  { kind: 'plane',  size: 48, top:  11, duration: 22, delay:   0, direction: 'ltr', opacity: 0.75 },
  // Train — rolls right-to-left across upper third
  { kind: 'train',  size: 38, top:  28, duration: 19, delay:  -6, direction: 'rtl', opacity: 0.65 },
  // Small distant plane — RTL mid-height
  { kind: 'plane',  size: 28, top:  40, duration: 27, delay: -11, direction: 'rtl', opacity: 0.38 },
  // Car — left-to-right middle
  { kind: 'car',    size: 36, top:  50, duration: 24, delay: -15, direction: 'ltr', opacity: 0.70 },
  // Bus — right-to-left lower section
  { kind: 'bus',    size: 52, top:  62, duration: 20, delay:  -4, direction: 'rtl', opacity: 0.55 },
  // Bike — cruises slowly left-to-right
  { kind: 'bike',   size: 32, top:  76, duration: 30, delay: -20, direction: 'ltr', opacity: 0.65 },
  // Small distant car — RTL upper zone (depth)
  { kind: 'car',    size: 22, top:  20, duration: 33, delay:  -9, direction: 'rtl', opacity: 0.32 },
  // Walker — strolls slowly, near bottom
  { kind: 'walker', size: 26, top:  88, duration: 42, delay: -27, direction: 'ltr', opacity: 0.50 },
];

/* ── Component ──────────────────────────────────────────────────────── */
export function ThreeCubeBg({ className }: { className?: string }) {
  return (
    <div
      className={className ?? 'w-full h-full'}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <style>{CSS}</style>

      {VEHICLES.map((v, i) => {
        const isPlane = v.kind === 'plane';
        const animName =
          isPlane
            ? v.direction === 'ltr' ? 'trvl-plane-ltr' : 'trvl-plane-rtl'
            : v.direction === 'ltr' ? 'trvl-ltr'        : 'trvl-rtl';

        // Planes tilt to show direction; RTL icons mirror horizontally
        const rotate = isPlane ? (v.direction === 'ltr' ? -18 : 18) : 0;
        const flipX  = !isPlane && v.direction === 'rtl' ? -1 : 1;

        const wrapStyle: React.CSSProperties = {
          position:  'absolute',
          top:       `${v.top}%`,
          // Start LTR off-screen-left, RTL off-screen-right (handled by keyframe)
          left:      0,
          color:     'hsl(213 100% 44%)',
          opacity:   v.opacity,
          animation: `${animName} ${v.duration}s linear ${v.delay}s infinite`,
          willChange: 'transform',
        };

        const imgStyle: React.CSSProperties = {
          width:     v.size,
          height:    'auto',
          display:   'block',
          transform: `scaleX(${flipX}) rotate(${rotate}deg)`,
          transformOrigin: 'center center',
          filter:    'drop-shadow(0 2px 6px rgba(0,85,212,0.35))',
        };

        const svgStyle: React.CSSProperties = {
          width:     v.size,
          height:    'auto',
          display:   'block',
          transform: `scaleX(${flipX}) rotate(${rotate}deg)`,
          transformOrigin: 'center center',
          filter:    'drop-shadow(0 2px 6px rgba(0,85,212,0.35))',
        };

        return (
          <div key={i} style={wrapStyle}>
            {v.kind === 'bus'    && <BusSVG    style={svgStyle} />}
            {v.kind === 'walker' && <WalkerSVG style={svgStyle} />}
            {(v.kind === 'plane' || v.kind === 'car' || v.kind === 'bike' || v.kind === 'train') && (
              <img
                src={`/icon-${v.kind}.png`}
                alt={v.kind}
                style={imgStyle}
                draggable={false}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
