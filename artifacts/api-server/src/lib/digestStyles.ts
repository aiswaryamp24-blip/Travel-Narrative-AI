/**
 * The 6 visual style presets a user can choose for their wrapped digest PDF.
 * Each preset controls background/foreground colors, accent color, and a
 * typographic personality that the PDF renderer applies throughout.
 */

export const DIGEST_STYLE_IDS = [
  'pop-art',
  'supermarket',
  'camera-interface',
  'canon-camera',
  'ios-core',
  'android-core',
] as const;

export type DigestStyleId = (typeof DIGEST_STYLE_IDS)[number];

export const DEFAULT_DIGEST_STYLE: DigestStyleId = 'canon-camera';

export type DigestStylePreset = {
  id: DigestStyleId;
  name: string;
  /** Main page/cover background */
  bg: string;
  /** Slightly lighter/darker surface for cards/boxes */
  surface: string;
  /** Primary body text */
  fg: string;
  /** Secondary / muted text */
  muted: string;
  /** High-contrast accent for numbers and kicker labels */
  accent: string;
  /** Accent text (on accent) */
  accentFg: string;
  /** Cover headline text */
  headlineFg: string;
  /** Cover sub-headline */
  subtitleFg: string;
  /** Monospace / label font (PDF built-in) */
  monoFont: 'Courier' | 'Courier-Bold';
  /** Serif display font (PDF built-in) */
  displayFont: 'Times-Roman' | 'Times-Bold' | 'Times-Italic' | 'Times-BoldItalic';
  /** Whether the cover uses an inverted (light-on-dark) layout */
  darkCover: boolean;
};

export const DIGEST_STYLES: Record<DigestStyleId, DigestStylePreset> = {
  'pop-art': {
    id: 'pop-art',
    name: 'Pop Art',
    bg: '#FFEC00',          // Ben-day yellow
    surface: '#FFFFFF',
    fg: '#0D0D0D',
    muted: '#3D3D3D',
    accent: '#E8112D',      // Primary red
    accentFg: '#FFFFFF',
    headlineFg: '#0D0D0D',
    subtitleFg: '#E8112D',
    monoFont: 'Courier-Bold',
    displayFont: 'Times-Bold',
    darkCover: false,
  },
  supermarket: {
    id: 'supermarket',
    name: 'Supermarket',
    bg: '#F5F5F0',          // Off-white receipt paper
    surface: '#FFFFFF',
    fg: '#111111',
    muted: '#555555',
    accent: '#CC0000',      // Supermarket red
    accentFg: '#FFFFFF',
    headlineFg: '#111111',
    subtitleFg: '#555555',
    monoFont: 'Courier',
    displayFont: 'Times-Roman',
    darkCover: false,
  },
  'camera-interface': {
    id: 'camera-interface',
    name: 'Viewfinder Interface',
    bg: '#0A0A0A',          // Black EVF
    surface: '#1A1A1A',
    fg: '#E8E8E8',
    muted: '#6B6B6B',
    accent: '#00FF41',      // Green CRT readout
    accentFg: '#0A0A0A',
    headlineFg: '#FFFFFF',
    subtitleFg: '#6B6B6B',
    monoFont: 'Courier-Bold',
    displayFont: 'Times-Roman',
    darkCover: true,
  },
  'canon-camera': {
    id: 'canon-camera',
    name: 'Canon Camera',
    bg: '#1A1A1A',          // Classic Canon body black
    surface: '#2A2A2A',
    fg: '#F0F0F0',
    muted: '#8A8A8A',
    accent: '#E0051E',      // Canon red logo
    accentFg: '#FFFFFF',
    headlineFg: '#FFFFFF',
    subtitleFg: '#8A8A8A',
    monoFont: 'Courier',
    displayFont: 'Times-Bold',
    darkCover: true,
  },
  'ios-core': {
    id: 'ios-core',
    name: 'iOS Core',
    bg: '#F2F2F7',          // iOS grouped background
    surface: '#FFFFFF',
    fg: '#1C1C1E',
    muted: '#8E8E93',
    accent: '#007AFF',      // iOS blue
    accentFg: '#FFFFFF',
    headlineFg: '#1C1C1E',
    subtitleFg: '#8E8E93',
    monoFont: 'Courier',
    displayFont: 'Times-Bold',
    darkCover: false,
  },
  'android-core': {
    id: 'android-core',
    name: 'Android Core',
    bg: '#1C1B1F',          // Material You dark surface
    surface: '#2B2930',
    fg: '#E6E1E5',
    muted: '#938F99',
    accent: '#D0BCFF',      // Material You tertiary purple
    accentFg: '#381E72',
    headlineFg: '#FFFFFF',
    subtitleFg: '#938F99',
    monoFont: 'Courier',
    displayFont: 'Times-BoldItalic',
    darkCover: true,
  },
};
