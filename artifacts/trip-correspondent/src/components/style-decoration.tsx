import type { TripStyleDef } from '@/lib/trip-styles';

/**
 * CSS-approximated decorative flourish for a trip's chosen visual style,
 * layered behind the hero content (see pages/trip.tsx). These are gradient/
 * pattern approximations of each reference board's graphic language
 * (halftone dots, hazard stripes, HUD corner brackets, tartan crosshatch,
 * frosted squircle glow, material elevation) rather than pixel-accurate
 * recreations of the original artwork — kept intentionally lightweight
 * since this renders on every trip page view.
 */
export function StyleDecoration({ pattern }: { pattern: TripStyleDef['pattern'] }) {
  const common = 'absolute inset-0 pointer-events-none';

  switch (pattern) {
    case 'halftone':
      return (
        <div
          className={common}
          style={{
            backgroundImage: 'radial-gradient(currentColor 1.5px, transparent 1.5px)',
            backgroundSize: '14px 14px',
            color: 'hsl(var(--primary))',
            opacity: 0.15,
          }}
        />
      );
    case 'stripes':
      return (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-3 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, hsl(var(--primary)) 0, hsl(var(--primary)) 10px, hsl(var(--secondary)) 10px, hsl(var(--secondary)) 20px)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-3 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, hsl(var(--primary)) 0, hsl(var(--primary)) 10px, hsl(var(--secondary)) 10px, hsl(var(--secondary)) 20px)',
            }}
          />
        </>
      );
    case 'hud': {
      const corner = 'absolute h-8 w-8 pointer-events-none';
      const borderColor = 'hsl(var(--primary) / 0.7)';
      return (
        <div className={common}>
          <div className={`${corner} top-6 left-6 border-t-2 border-l-2`} style={{ borderColor }} />
          <div className={`${corner} top-6 right-6 border-t-2 border-r-2`} style={{ borderColor }} />
          <div className={`${corner} bottom-6 left-6 border-b-2 border-l-2`} style={{ borderColor }} />
          <div className={`${corner} bottom-6 right-6 border-b-2 border-r-2`} style={{ borderColor }} />
        </div>
      );
    }
    case 'plaid':
      return (
        <div
          className={common}
          style={{
            backgroundImage: [
              'repeating-linear-gradient(0deg, hsl(var(--primary) / 0.12) 0, hsl(var(--primary) / 0.12) 2px, transparent 2px, transparent 40px)',
              'repeating-linear-gradient(90deg, hsl(var(--secondary) / 0.12) 0, hsl(var(--secondary) / 0.12) 2px, transparent 2px, transparent 40px)',
            ].join(', '),
          }}
        />
      );
    case 'squircle':
      return (
        <div
          className={common}
          style={{
            backgroundImage: 'radial-gradient(60% 50% at 50% 20%, hsl(var(--primary) / 0.15), transparent 70%)',
          }}
        />
      );
    case 'elevation':
      return (
        <div
          className={common}
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08), transparent 45%), radial-gradient(circle at 80% 70%, hsl(var(--secondary) / 0.1), transparent 45%)',
          }}
        />
      );
    default:
      return null;
  }
}
