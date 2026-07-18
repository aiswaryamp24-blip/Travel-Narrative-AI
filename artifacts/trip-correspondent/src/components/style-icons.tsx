import type { TripStyleDef } from '@/lib/trip-styles';

/**
 * A small recurring icon per visual style, matching each aesthetic's
 * reference language (comic-burst / barcode / viewfinder / aperture /
 * squircle-app-icon / material-FAB) — rendered once per day section on the
 * trip page so the chosen style reads consistently through the whole
 * archive, not just in the hero. Single-color line icons that inherit the
 * trip's --primary color automatically via currentColor.
 */
export function StyleIcon({ style, className = 'h-6 w-6' }: { style: TripStyleDef['pattern']; className?: string }) {
  switch (style) {
    case 'halftone': // Pop Art — comic-burst
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" className={className} aria-hidden="true">
          <path d="M12 2 L14 9 L21 7 L16 12 L21 17 L14 15 L12 22 L10 15 L3 17 L8 12 L3 7 L10 9 Z" />
        </svg>
      );
    case 'stripes': // Supermarket — barcode
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className={className} aria-hidden="true">
          <path d="M3 4v16M6 4v16M8 4v16M11 4v16M13 4v16M16 4v16M18 4v16M21 4v16" strokeWidth={1.5} />
        </svg>
      );
    case 'hud': // Viewfinder Interface — REC dot + crosshair
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
        </svg>
      );
    case 'viewfinder': // Canon Camera — aperture blades
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 4.5 L15.5 10 L12 12 Z M19.2 8.5 L14.8 10.3 L15.8 14.2 Z M17 18 L12.5 15 L12 19 Z M7 18 L11.5 15 L11 19 Z M4.8 8.5 L9.2 10.3 L8.2 14.2 Z" strokeLinecap="round" />
        </svg>
      );
    case 'squircle': // iOS Core — rounded app-icon
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="6" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      );
    case 'elevation': // Android Core — material FAB
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    default:
      return null;
  }
}
