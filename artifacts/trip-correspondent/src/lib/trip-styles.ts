import type { DigestStyle } from '@workspace/api-client-react';

/**
 * Full per-trip visual identity presets — colors as raw "H S% L%" triplets
 * matching index.css's CSS-variable format (so they can be dropped directly
 * into a `[data-trip-style="..."]` override block), plus the fonts and
 * decorative pattern each style pairs with. Reuses the same 6 ids as the
 * wrapped-digest `DigestStyle` system, but this is a separate, richer
 * definition applied per-trip to the story page rather than per-user to a
 * PDF — see digests-section.tsx's simpler STYLE_DEFS for that other use.
 */
export interface TripStyleDef {
  id: DigestStyle;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
  };
  fonts: {
    /** Headline/display typeface (maps to --app-font-serif). */
    display: string;
    /** Body/data typeface (maps to --app-font-sans). */
    body: string;
  };
  pattern: 'halftone' | 'stripes' | 'hud' | 'plaid' | 'squircle' | 'elevation';
}

export const TRIP_STYLES: TripStyleDef[] = [
  {
    id: 'pop-art',
    name: 'Pop Art',
    description: 'Bold primaries, thick borders, halftone energy',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 7%',
      card: '0 0% 100%',
      cardForeground: '0 0% 7%',
      primary: '355 100% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '220 100% 50%',
      secondaryForeground: '0 0% 100%',
      muted: '50 100% 95%',
      mutedForeground: '0 0% 30%',
      accent: '50 100% 50%',
      accentForeground: '0 0% 7%',
      border: '0 0% 7%',
    },
    fonts: { display: "'Bricolage Grotesque', sans-serif", body: "'Noto Sans JP', sans-serif" },
    pattern: 'halftone',
  },
  {
    id: 'supermarket',
    name: 'Supermarket',
    description: 'High-street signage — pillarbox red, navy, sunshine yellow',
    colors: {
      background: '0 0% 100%',
      foreground: '226 100% 22%',
      card: '0 0% 100%',
      cardForeground: '226 100% 22%',
      primary: '1 75% 52%',
      primaryForeground: '0 0% 100%',
      secondary: '51 100% 50%',
      secondaryForeground: '226 100% 22%',
      muted: '31 41% 92%',
      mutedForeground: '226 40% 35%',
      accent: '148 100% 32%',
      accentForeground: '0 0% 100%',
      border: '226 100% 22%',
    },
    fonts: { display: "'Anton', sans-serif", body: "'DM Sans', sans-serif" },
    pattern: 'stripes',
  },
  {
    id: 'camera-interface',
    name: 'Viewfinder Interface',
    description: 'Black EVF, emerald HUD readouts',
    colors: {
      background: '150 17% 5%',
      foreground: '42 25% 90%',
      card: '147 9% 19%',
      cardForeground: '42 25% 90%',
      primary: '147 70% 35%',
      primaryForeground: '0 0% 100%',
      secondary: '46 65% 52%',
      secondaryForeground: '150 17% 5%',
      muted: '147 9% 15%',
      mutedForeground: '42 15% 65%',
      accent: '346 100% 50%',
      accentForeground: '0 0% 100%',
      border: '147 20% 25%',
    },
    fonts: { display: "'Cormorant', serif", body: "'Space Mono', monospace" },
    pattern: 'hud',
  },
  {
    id: 'canon-camera',
    name: 'Canon Camera',
    description: 'Classic body black, viewfinder blue',
    colors: {
      background: '0 0% 4%',
      foreground: '0 0% 95%',
      card: '0 0% 8%',
      cardForeground: '0 0% 95%',
      primary: '208 100% 37%',
      primaryForeground: '0 0% 100%',
      secondary: '290 35% 45%',
      secondaryForeground: '0 0% 100%',
      muted: '214 3% 20%',
      mutedForeground: '214 3% 65%',
      accent: '138 25% 39%',
      accentForeground: '0 0% 100%',
      border: '214 3% 30%',
    },
    fonts: { display: "'Playfair Display', serif", body: "'JetBrains Mono', monospace" },
    pattern: 'plaid',
  },
  {
    id: 'ios-core',
    name: 'iOS Core',
    description: 'Light grouped backgrounds, soft squircles',
    colors: {
      background: '220 16% 96%',
      foreground: '210 12% 13%',
      card: '0 0% 100%',
      cardForeground: '210 12% 13%',
      primary: '355 73% 47%',
      primaryForeground: '0 0% 100%',
      secondary: '39 91% 57%',
      secondaryForeground: '210 12% 13%',
      muted: '228 14% 93%',
      mutedForeground: '206 6% 44%',
      accent: '136 30% 42%',
      accentForeground: '0 0% 100%',
      border: '228 14% 88%',
    },
    fonts: { display: "'Inter', sans-serif", body: "'Inter', sans-serif" },
    pattern: 'squircle',
  },
  {
    id: 'android-core',
    name: 'Android Core',
    description: 'Material dark surface, tertiary purple',
    colors: {
      background: '255 7% 11%',
      foreground: '312 9% 89%',
      card: '257 8% 17%',
      cardForeground: '312 9% 89%',
      primary: '258 100% 87%',
      primaryForeground: '255 7% 11%',
      secondary: '147 66% 58%',
      secondaryForeground: '255 7% 11%',
      muted: '257 8% 22%',
      mutedForeground: '264 5% 65%',
      accent: '147 66% 58%',
      accentForeground: '255 7% 11%',
      border: '257 8% 25%',
    },
    fonts: { display: "'Roboto', sans-serif", body: "'Roboto Mono', monospace" },
    pattern: 'elevation',
  },
];

export function getTripStyle(id: DigestStyle): TripStyleDef {
  return TRIP_STYLES.find((s) => s.id === id) ?? TRIP_STYLES[3];
}
