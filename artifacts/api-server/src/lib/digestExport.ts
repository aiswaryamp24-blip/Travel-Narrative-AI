import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import sharp from 'sharp';
import type { Photo, Trip, TripDay, User } from '@workspace/db';
import { ObjectStorageService } from './objectStorage';
import {
  DIGEST_STYLES,
  DEFAULT_DIGEST_STYLE,
  type DigestStyleId,
  type DigestStylePreset,
} from './digestStyles';

const e = React.createElement;

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function buildStyles(p: DigestStylePreset) {
  return StyleSheet.create({
    coverPage: {
      backgroundColor: p.bg,
      padding: 0,
    },
    coverContainer: {
      width: A4_WIDTH,
      height: A4_HEIGHT,
      padding: 56,
      justifyContent: 'space-between',
    },
    kicker: {
      fontFamily: p.monoFont,
      fontSize: 10,
      letterSpacing: 4,
      color: p.accent,
      textTransform: 'uppercase',
    },
    coverTitle: {
      fontFamily: p.displayFont,
      fontSize: 54,
      color: p.headlineFg,
      lineHeight: 1.05,
      marginTop: 20,
    },
    coverSubtitle: {
      fontFamily: 'Times-Italic',
      fontSize: 16,
      color: p.subtitleFg,
      marginTop: 16,
    },
    coverFooter: {
      fontFamily: p.monoFont,
      fontSize: 9,
      letterSpacing: 1.5,
      color: p.muted,
      textTransform: 'uppercase',
    },
    // Cover accent bar (style-specific decoration)
    accentBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: A4_WIDTH,
      height: 16,
      backgroundColor: p.accent,
    },
    // For pop-art: thick black border rectangle inside the cover
    popArtBorder: {
      position: 'absolute',
      top: 28,
      left: 28,
      width: A4_WIDTH - 56,
      height: A4_HEIGHT - 56,
      borderWidth: 6,
      borderColor: '#0D0D0D',
    },
    // For supermarket: barcode-style lines at bottom of cover
    supermarketStripes: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 24,
    },
    supermarketStripe: {
      height: 36,
      backgroundColor: '#111111',
    },
    statsPage: {
      backgroundColor: p.bg,
      padding: 56,
      color: p.fg,
    },
    sectionTitle: {
      fontFamily: p.displayFont,
      fontSize: 24,
      color: p.fg,
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    statBox: {
      width: '47%',
      borderWidth: 1,
      borderColor: p.surface,
      backgroundColor: p.surface,
      padding: 18,
    },
    statLabel: {
      fontFamily: p.monoFont,
      fontSize: 8,
      letterSpacing: 1.5,
      color: p.muted,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    statValue: {
      fontFamily: p.displayFont,
      fontSize: 32,
      color: p.accent,
    },
    highlightPage: {
      padding: 0,
    },
    highlightContainer: {
      position: 'relative',
      width: A4_WIDTH,
      height: A4_HEIGHT,
    },
    highlightImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: A4_WIDTH,
      height: A4_HEIGHT,
      objectFit: 'cover',
    },
    highlightPlaceholder: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: A4_WIDTH,
      height: A4_HEIGHT,
      backgroundColor: p.bg,
    },
    highlightOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: A4_WIDTH,
      padding: 48,
      backgroundColor: p.darkCover ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.82)',
    },
    highlightKicker: {
      fontFamily: p.monoFont,
      fontSize: 9,
      letterSpacing: 3,
      color: p.accent,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    highlightTitle: {
      fontFamily: p.displayFont,
      fontSize: 30,
      color: p.headlineFg,
      lineHeight: 1.1,
    },
    highlightHeadline: {
      fontFamily: 'Times-Italic',
      fontSize: 14,
      color: p.subtitleFg,
      marginTop: 12,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 48,
      right: 48,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontFamily: p.monoFont,
      fontSize: 8,
      color: p.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Camera-style HUD elements
    hudCornerTL: {
      position: 'absolute',
      top: 28,
      left: 28,
      width: 32,
      height: 32,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderColor: p.accent,
    },
    hudCornerBR: {
      position: 'absolute',
      bottom: 28,
      right: 28,
      width: 32,
      height: 32,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderColor: p.accent,
    },
    // iOS/Android pill badge
    pillBadge: {
      backgroundColor: p.accent,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 5,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    pillBadgeText: {
      fontFamily: p.monoFont,
      fontSize: 9,
      color: p.accentFg,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  });
}

type EmbeddedImage = { data: Buffer; format: 'jpg' } | null;

async function fetchEmbeddableImage(
  objectStorageService: ObjectStorageService,
  objectPath: string | null | undefined,
  maxWidth: number,
): Promise<EmbeddedImage> {
  if (!objectPath) return null;
  try {
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    const [original] = await file.download();
    const data = await sharp(original)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    return { data, format: 'jpg' };
  } catch {
    return null;
  }
}

function formatTemp(c: number | null | undefined): string | null {
  if (c === null || c === undefined) return null;
  return `${Math.round(c)}°C`;
}

function formatPeriod(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return `${fmt(start)} — ${fmt(end)}`;
}

export type DigestTripBundle = {
  trip: Trip;
  days: TripDay[];
  photos: Photo[];
};

/** Background decorations: rendered BEFORE the text, fills the canvas behind the copy */
function renderCoverBackground(styleId: DigestStyleId, A4W: number, A4H: number) {
  switch (styleId) {
    case 'pop-art':
      return e(
        React.Fragment, {},
        // Solid red header band
        e(View, { style: { position: 'absolute', top: 0, left: 0, width: A4W, height: 72, backgroundColor: '#E8112D' } }),
        e(View, { style: { position: 'absolute', top: 18, left: 56 } },
          e(Text, { style: { fontFamily: 'Courier-Bold', fontSize: 18, color: '#FFEC00', letterSpacing: 6 } }, 'TURASUM DISPATCH'),
        ),
        // Large red circle bleeding off right edge
        e(View, { style: { position: 'absolute', right: -90, top: 55, width: 290, height: 290, borderRadius: 145, backgroundColor: '#E8112D' } }),
        // Ben-day halftone dots — right side
        ...Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) =>
            e(View, { key: `dot-${row}-${col}`, style: { position: 'absolute', right: 36 + col * 26, top: 368 + row * 26, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8112D', opacity: 0.22 } }),
          )
        ).flat(),
        // Three bold horizontal stripes
        e(View, { style: { position: 'absolute', left: 0, top: 374, width: A4W, height: 14, backgroundColor: '#E8112D' } }),
        e(View, { style: { position: 'absolute', left: 0, top: 392, width: A4W, height: 5, backgroundColor: '#0D0D0D' } }),
        e(View, { style: { position: 'absolute', left: 0, top: 401, width: A4W, height: 14, backgroundColor: '#E8112D' } }),
        // Solid black rectangle bottom-left
        e(View, { style: { position: 'absolute', left: -16, bottom: 56, width: 96, height: 96, backgroundColor: '#0D0D0D' } }),
      );

    case 'supermarket':
      return e(
        React.Fragment, {},
        // Red header bar
        e(View, { style: { position: 'absolute', top: 0, left: 0, width: A4W, height: 68, backgroundColor: '#CC0000' } }),
        e(View, { style: { position: 'absolute', top: 14, left: 56 } },
          e(Text, { style: { fontFamily: 'Courier-Bold', fontSize: 22, color: '#FFFFFF', letterSpacing: 4 } }, 'TURASUM STORES'),
        ),
        e(View, { style: { position: 'absolute', top: 44, left: 58 } },
          e(Text, { style: { fontFamily: 'Courier', fontSize: 8, color: 'rgba(255,255,255,0.75)', letterSpacing: 3 } }, 'FIELD EDITION · SPECIAL RECEIPT'),
        ),
        // Dashed separator
        ...Array.from({ length: 28 }, (_, i) =>
          e(View, { key: `dash-${i}`, style: { position: 'absolute', left: 40 + i * 18, top: 80, width: 11, height: 3, backgroundColor: '#CC0000' } }),
        ),
        // Three-star rating
        e(View, { style: { position: 'absolute', right: 56, top: 108 } },
          e(Text, { style: { fontFamily: 'Times-Bold', fontSize: 30, color: '#CC0000' } }, '★★★'),
        ),
        // Receipt rule lines
        ...Array.from({ length: 6 }, (_, i) =>
          e(View, { key: `rule-${i}`, style: { position: 'absolute', left: 40, right: 40, top: 330 + i * 44, height: 1, backgroundColor: '#CCCCCC' } }),
        ),
      );

    case 'camera-interface':
      return e(
        React.Fragment, {},
        // Subtle scan lines
        ...Array.from({ length: 24 }, (_, i) =>
          e(View, { key: `scan-${i}`, style: { position: 'absolute', left: 0, top: i * 36, width: A4W, height: 1, backgroundColor: '#00FF41', opacity: 0.06 } }),
        ),
        // Center reticle
        e(View, { style: { position: 'absolute', top: A4H / 2 - 50, left: A4W / 2 - 50, width: 100, height: 100, borderWidth: 1, borderColor: '#00FF41', opacity: 0.18 } }),
        // Crosshairs
        e(View, { style: { position: 'absolute', top: A4H / 2 - 36, left: A4W / 2, width: 1, height: 26, backgroundColor: '#00FF41', opacity: 0.35 } }),
        e(View, { style: { position: 'absolute', top: A4H / 2 + 10, left: A4W / 2, width: 1, height: 26, backgroundColor: '#00FF41', opacity: 0.35 } }),
        e(View, { style: { position: 'absolute', top: A4H / 2, left: A4W / 2 - 36, width: 26, height: 1, backgroundColor: '#00FF41', opacity: 0.35 } }),
        e(View, { style: { position: 'absolute', top: A4H / 2, left: A4W / 2 + 10, width: 26, height: 1, backgroundColor: '#00FF41', opacity: 0.35 } }),
      );

    case 'canon-camera':
      return e(
        React.Fragment, {},
        // Lens ring graphic bleeding off right edge
        e(View, { style: { position: 'absolute', right: -50, top: 108, width: 250, height: 250, borderRadius: 125, borderWidth: 14, borderColor: '#2A2A2A' } }),
        e(View, { style: { position: 'absolute', right: -22, top: 136, width: 194, height: 194, borderRadius: 97, borderWidth: 7, borderColor: '#333333' } }),
        e(View, { style: { position: 'absolute', right: 8, top: 166, width: 134, height: 134, borderRadius: 67, backgroundColor: '#0A0A0A', borderWidth: 3, borderColor: '#E0051E' } }),
        // Shutter button dot
        e(View, { style: { position: 'absolute', right: 46, top: 206, width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0051E' } }),
        // Horizontal red accent stripe
        e(View, { style: { position: 'absolute', left: 0, top: 370, width: A4W * 0.52, height: 8, backgroundColor: '#E0051E' } }),
      );

    case 'ios-core':
      return e(
        React.Fragment, {},
        // App icon grid (2 rows × 3 cols), right side
        ...Array.from({ length: 2 }, (_, row) =>
          Array.from({ length: 3 }, (_, col) => {
            const colors = ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE', '#5AC8FA'];
            return e(View, { key: `icon-${row}-${col}`, style: { position: 'absolute', right: 52 + col * 72, top: 120 + row * 72, width: 54, height: 54, borderRadius: 12, backgroundColor: colors[row * 3 + col] ?? '#007AFF', opacity: 0.82 } });
          })
        ).flat(),
        // Subtle card outline
        e(View, { style: { position: 'absolute', left: 40, top: 80, right: 40, bottom: 60, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(0,122,255,0.22)' } }),
      );

    case 'android-core':
      return e(
        React.Fragment, {},
        // Material You surface cards
        e(View, { style: { position: 'absolute', right: 40, top: 80, width: 190, height: 108, borderRadius: 24, backgroundColor: '#2B2930' } }),
        e(View, { style: { position: 'absolute', right: 70, top: 206, width: 148, height: 84, borderRadius: 20, backgroundColor: '#2B2930', opacity: 0.65 } }),
        // Purple glow blob top-left
        e(View, { style: { position: 'absolute', left: -70, top: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: '#D0BCFF', opacity: 0.10 } }),
        // Purple accent stripe
        e(View, { style: { position: 'absolute', left: 0, top: 360, width: A4W, height: 6, backgroundColor: '#D0BCFF', opacity: 0.3 } }),
      );

    default:
      return null;
  }
}

/** Foreground decorations: rendered AFTER the text — borders, HUD chrome, status bars */
function renderCoverForeground(styleId: DigestStyleId) {
  switch (styleId) {
    case 'pop-art':
      // Thick comic-book inner border frame
      return e(View, { style: { position: 'absolute', top: 22, left: 22, width: A4_WIDTH - 44, height: A4_HEIGHT - 44, borderWidth: 10, borderColor: '#0D0D0D' } });

    case 'supermarket':
      // Enhanced barcode at bottom
      return e(
        View, { style: { position: 'absolute', bottom: 40, left: 40 } },
        e(View, { style: { flexDirection: 'row', gap: 2 } },
          ...[5,2,4,1,3,2,5,1,4,3,2,1,5,2,4,1,3,2,4,5,1,3,2,5,1,4,2,3,1,5].map((w, i) =>
            e(View, { key: i, style: { height: 56, width: w * 2.8, backgroundColor: '#111111' } })
          )
        ),
        e(View, { style: { marginTop: 4 } },
          e(Text, { style: { fontFamily: 'Courier', fontSize: 7, color: '#333333', letterSpacing: 3 } }, '4729 0182 3847 0192'),
        ),
      );

    case 'camera-interface':
      return e(
        React.Fragment, {},
        // All 4 HUD corners
        e(View, { style: { position: 'absolute', top: 28, left: 28, width: 64, height: 64, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#00FF41' } }),
        e(View, { style: { position: 'absolute', top: 28, right: 28, width: 64, height: 64, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#00FF41' } }),
        e(View, { style: { position: 'absolute', bottom: 28, left: 28, width: 64, height: 64, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#00FF41' } }),
        e(View, { style: { position: 'absolute', bottom: 28, right: 28, width: 64, height: 64, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#00FF41' } }),
        // REC badge
        e(View, { style: { position: 'absolute', top: 44, right: 56, flexDirection: 'row', alignItems: 'center', gap: 8 } },
          e(View, { style: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF0000' } }),
          e(View, {}, e(Text, { style: { fontFamily: 'Courier-Bold', fontSize: 14, color: '#00FF41', letterSpacing: 4 } }, 'REC')),
        ),
        // Exposure bar
        e(View, { style: { position: 'absolute', right: 36, top: 140, height: 200, width: 8, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#00FF41' } }),
        e(View, { style: { position: 'absolute', right: 37, top: 200, height: 140, width: 6, backgroundColor: '#00FF41', opacity: 0.6 } }),
        // Bottom status line
        e(View, { style: { position: 'absolute', bottom: 44, left: 44, right: 44, borderTopWidth: 1, borderColor: '#00FF41', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' } },
          e(View, {}, e(Text, { style: { fontFamily: 'Courier-Bold', fontSize: 8, color: '#00FF41', letterSpacing: 3 } }, 'ISO 400  ·  f/2.8  ·  1/125')),
          e(View, {}, e(Text, { style: { fontFamily: 'Courier', fontSize: 8, color: '#00FF41', letterSpacing: 2 } }, '●●●●○')),
        ),
      );

    case 'canon-camera':
      return e(
        React.Fragment, {},
        // All 4 HUD corners
        e(View, { style: { position: 'absolute', top: 28, left: 28, width: 56, height: 56, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#E0051E' } }),
        e(View, { style: { position: 'absolute', top: 28, right: 28, width: 56, height: 56, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#E0051E' } }),
        e(View, { style: { position: 'absolute', bottom: 28, left: 28, width: 56, height: 56, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#E0051E' } }),
        e(View, { style: { position: 'absolute', bottom: 28, right: 28, width: 56, height: 56, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#E0051E' } }),
        // Bottom data bar
        e(View, { style: { position: 'absolute', bottom: 52, left: 44, right: 44, borderTopWidth: 1, borderColor: '#E0051E', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
          e(View, {}, e(Text, { style: { fontFamily: 'Courier-Bold', fontSize: 9, color: '#E0051E', letterSpacing: 3 } }, 'EOS TURASUM')),
          e(View, {}, e(Text, { style: { fontFamily: 'Courier', fontSize: 9, color: '#8A8A8A', letterSpacing: 2 } }, 'RAW  ·  AWB  ·  MF')),
        ),
      );

    case 'ios-core':
      return e(
        React.Fragment, {},
        // Status bar
        e(View, { style: { position: 'absolute', top: 0, left: 0, width: A4_WIDTH, height: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(242,242,247,0.95)' } },
          e(View, {}, e(Text, { style: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1C1C1E' } }, '9:41')),
          e(View, {}, e(Text, { style: { fontFamily: 'Helvetica', fontSize: 9, color: '#1C1C1E' } }, '■■■ WiFi ████')),
        ),
        // Home indicator bar
        e(View, { style: { position: 'absolute', bottom: 18, left: A4_WIDTH / 2 - 64, width: 128, height: 6, borderRadius: 3, backgroundColor: '#1C1C1E', opacity: 0.2 } }),
        // Blue app badge
        e(View, { style: { position: 'absolute', left: 56, top: 48, backgroundColor: '#007AFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 } },
          e(Text, { style: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#FFFFFF', letterSpacing: 1 } }, 'TURASUM'),
        ),
      );

    case 'android-core':
      return e(
        React.Fragment, {},
        // Navigation bar
        e(View, { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 52, backgroundColor: '#2B2930', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 40 } },
          e(View, {}, e(Text, { style: { fontFamily: 'Helvetica', fontSize: 20, color: '#D0BCFF' } }, '‹')),
          e(View, {}, e(Text, { style: { fontFamily: 'Helvetica', fontSize: 16, color: '#D0BCFF' } }, '○')),
          e(View, {}, e(Text, { style: { fontFamily: 'Helvetica', fontSize: 14, color: '#D0BCFF' } }, '□')),
        ),
        // FAB
        e(View, { style: { position: 'absolute', right: 48, bottom: 68, width: 60, height: 60, borderRadius: 18, backgroundColor: '#D0BCFF', alignItems: 'center', justifyContent: 'center' } },
          e(View, {}, e(Text, { style: { fontFamily: 'Helvetica-Bold', fontSize: 28, color: '#381E72' } }, '+')),
        ),
        // Purple badge
        e(View, { style: { position: 'absolute', left: 56, top: 56, backgroundColor: '#D0BCFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5 } },
          e(Text, { style: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#381E72', letterSpacing: 1 } }, 'TURASUM'),
        ),
      );

    default:
      return null;
  }
}

/** Render the style-specific kicker on highlight pages */
function renderHighlightKicker(styleId: DigestStyleId, styles: ReturnType<typeof buildStyles>) {
  switch (styleId) {
    case 'ios-core':
    case 'android-core':
      return e(
        View,
        { style: styles.pillBadge },
        e(Text, { style: styles.pillBadgeText }, 'Featured Dispatch'),
      );
    default:
      return e(Text, { style: styles.highlightKicker }, 'Featured Dispatch');
  }
}

/**
 * Generates a "wrapped"-style recap PDF covering a set of a user's completed
 * trips within a period. Accepts a style preset id that controls the visual
 * treatment throughout (colors, typography, accent decorations).
 */
export async function generateDigestPdf(
  user: User,
  periodStart: Date,
  periodEnd: Date,
  bundles: DigestTripBundle[],
  styleId: DigestStyleId = DEFAULT_DIGEST_STYLE,
): Promise<Buffer> {
  const preset = DIGEST_STYLES[styleId];
  if (!preset) {
    throw new Error(
      `Unknown digest style ID: "${styleId}". Valid IDs are: ${Object.keys(DIGEST_STYLES).join(', ')}.`,
    );
  }
  const styles = buildStyles(preset);

  const objectStorageService = new ObjectStorageService();

  const allDays = bundles.flatMap((b) => b.days);
  const allPhotos = bundles.flatMap((b) => b.photos);
  const totalDays = allDays.length;
  const totalDistanceKm = allDays.reduce((sum, d) => sum + (d.distanceKm ?? 0), 0);
  const locations = new Set(
    allDays.map((d) => d.locationName).filter((l): l is string => !!l),
  );
  const temps = allDays
    .map((d) => d.weather?.tempMaxC)
    .filter((t): t is number => typeof t === 'number');
  const lowTemps = allDays
    .map((d) => d.weather?.tempMinC)
    .filter((t): t is number => typeof t === 'number');
  const tempRange =
    temps.length > 0 || lowTemps.length > 0
      ? `${formatTemp(Math.min(...lowTemps, ...temps)) ?? '—'} to ${formatTemp(Math.max(...temps, ...lowTemps)) ?? '—'}`
      : '—';

  // Compile facts for the BBC-style news briefing page
  const weatherDescriptions = [...new Set(
    allDays.map((d) => (d.weather as any)?.description).filter(Boolean) as string[],
  )];
  const tripTitles = bundles.map((b) => b.trip.title);
  const bbcFacts: string[] = [
    `Field correspondent filed ${bundles.length} complete ${bundles.length === 1 ? 'report' : 'reports'} this season.`,
    `${totalDays} days of active documentation across ${locations.size} ${locations.size === 1 ? 'location' : 'locations'}.`,
    totalDistanceKm > 0 ? `${Math.round(totalDistanceKm).toLocaleString()} km traversed by our correspondent across all assignments.` : null,
    allPhotos.length > 0 ? `${allPhotos.length} photographs submitted as evidence from the field.` : null,
    tempRange !== '—' ? `Temperature conditions ranged from ${tempRange} across the period.` : null,
    weatherDescriptions.length > 0 ? `Recorded conditions: ${weatherDescriptions.slice(0, 3).join(', ')}.` : null,
    locations.size > 0 ? `Locations documented: ${[...locations].slice(0, 6).join(' · ')}.` : null,
  ].filter((f): f is string => !!f);

  const coverBg = renderCoverBackground(styleId, A4_WIDTH, A4_HEIGHT);
  const coverFg = renderCoverForeground(styleId);

  const coverPage = e(
    Page,
    { size: 'A4', style: styles.coverPage },
    // Background layer — shapes, patterns, bands behind the text
    coverBg,
    e(
      View,
      { style: styles.coverContainer },
      e(
        View,
        {},
        e(Text, { style: styles.kicker }, 'Your Trip Correspondent Wrapped'),
        e(Text, { style: styles.coverTitle }, user.displayName),
        e(Text, { style: styles.coverSubtitle }, formatPeriod(periodStart, periodEnd)),
      ),
      e(
        Text,
        { style: styles.coverFooter },
        `${bundles.length} trip${bundles.length === 1 ? '' : 's'} filed this season · ${preset.name}`,
      ),
    ),
    // Foreground layer — borders, HUD chrome, UI elements over text
    coverFg,
    // Accent bottom bar on all styles
    e(View, { style: styles.accentBar }),
  );

  const statBoxes: Array<[string, string]> = [
    ['Trips Taken', String(bundles.length)],
    ['Days Documented', String(totalDays)],
    ['Distance Covered', totalDistanceKm > 0 ? `${Math.round(totalDistanceKm)} km` : '—'],
    ['Places Visited', String(locations.size)],
    ['Weather Range', tempRange],
  ];

  const statsPage = e(
    Page,
    { size: 'A4', style: styles.statsPage },
    e(Text, { style: styles.sectionTitle }, 'The Numbers'),
    e(
      View,
      { style: styles.statsGrid },
      ...statBoxes.map(([label, value]) =>
        e(
          View,
          { style: styles.statBox, key: label },
          e(Text, { style: styles.statLabel }, label),
          e(Text, { style: styles.statValue }, value),
        ),
      ),
    ),
    e(
      View,
      { style: styles.footer, fixed: true },
      e(Text, {}, 'Trip Correspondent · Wrapped'),
      e(
        Text,
        { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` },
      ),
    ),
  );

  // BBC-style news briefing page — style-independent broadcast format
  const bbcPage = e(
    Page,
    { size: 'A4', style: { padding: 0, backgroundColor: '#FFFFFF' } },
    // Red broadcast header bar
    e(
      View,
      { style: { backgroundColor: '#CC0000', paddingHorizontal: 48, paddingTop: 36, paddingBottom: 28 } },
      e(
        View,
        { style: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 } },
        e(View, { style: { width: 36, height: 36, backgroundColor: '#FFFFFF' } }),
        e(View, { style: { flex: 1 } },
          e(Text, { style: { fontFamily: 'Times-Bold', fontSize: 22, color: '#FFFFFF', letterSpacing: 1 } }, 'SPECIAL REPORT'),
          e(View, { style: { height: 2, backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 4 } }),
        ),
      ),
      e(Text, { style: { fontFamily: 'Courier', fontSize: 8, color: 'rgba(255,255,255,0.85)', letterSpacing: 3, textTransform: 'uppercase' } },
        `TURASUM FIELD CORRESPONDENT  ·  SEASON IN REVIEW  ·  ${formatPeriod(periodStart, periodEnd).toUpperCase()}`,
      ),
    ),
    // Assignments ticker strip
    e(
      View,
      { style: { backgroundColor: '#1A1A1A', paddingHorizontal: 48, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 } },
      e(View, { style: { backgroundColor: '#CC0000', paddingHorizontal: 8, paddingVertical: 3 } },
        e(Text, { style: { fontFamily: 'Courier-Bold', fontSize: 7, color: '#FFFFFF', letterSpacing: 2 } }, 'FILED'),
      ),
      e(Text, { style: { fontFamily: 'Courier', fontSize: 8, color: '#E5E5E5', letterSpacing: 1, flex: 1 } },
        tripTitles.join('  ·  '),
      ),
    ),
    // Main content: "THE EVIDENCE" headline + fact list
    e(
      View,
      { style: { paddingHorizontal: 48, paddingTop: 32, paddingBottom: 48, flex: 1 } },
      e(Text, { style: { fontFamily: 'Times-Bold', fontSize: 28, color: '#1A1A1A', marginBottom: 6 } }, 'FROM THE FIELD: THE EVIDENCE'),
      e(View, { style: { height: 3, backgroundColor: '#CC0000', marginBottom: 28 } }),
      ...bbcFacts.map((fact, i) =>
        e(
          View,
          {
            key: i,
            style: {
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: 18,
              paddingBottom: 18,
              borderBottomWidth: i < bbcFacts.length - 1 ? 1 : 0,
              borderBottomColor: '#E8E8E8',
            },
          },
          e(View, { style: { width: 5, height: 5, backgroundColor: '#CC0000', marginTop: 6, marginRight: 16, flexShrink: 0 } }),
          e(Text, { style: { fontFamily: 'Times-Roman', fontSize: 13, color: '#1A1A1A', lineHeight: 1.55, flex: 1 } }, fact),
        ),
      ),
    ),
    // Footer ticker
    e(
      View,
      { style: { backgroundColor: '#1A1A1A', paddingHorizontal: 48, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
      e(Text, { style: { fontFamily: 'Courier', fontSize: 7, color: '#888888', letterSpacing: 2 } }, 'TURASUM · FIELD CORRESPONDENT NETWORK'),
      e(Text, { style: { fontFamily: 'Courier', fontSize: 7, color: '#888888', letterSpacing: 2 } }, 'CORRESPONDENT WRAPPED'),
    ),
  );

  const highlightImages = await Promise.all(
    bundles.map(async ({ trip, days }) => {
      const image = await fetchEmbeddableImage(objectStorageService, trip.coverObjectPath, 1600);
      const headline = [...days].sort((a, b) => a.dayIndex - b.dayIndex).find((d) => d.headline)?.headline ?? null;
      return { trip, image, headline };
    }),
  );

  const highlightPages = highlightImages.map(({ trip, image, headline }) =>
    e(
      Page,
      { size: 'A4', style: styles.highlightPage, key: trip.id },
      e(
        View,
        { style: styles.highlightContainer },
        image
          ? e(Image, { src: { data: image.data, format: image.format }, style: styles.highlightImage })
          : e(View, { style: styles.highlightPlaceholder }),
        e(
          View,
          { style: styles.highlightOverlay },
          renderHighlightKicker(styleId, styles),
          e(Text, { style: styles.highlightTitle }, trip.title),
          headline && e(Text, { style: styles.highlightHeadline }, headline),
        ),
      ),
    ),
  );

  const doc = e(
    Document,
    { title: `${user.displayName} — Trip Correspondent Wrapped` },
    coverPage,
    statsPage,
    bbcPage,
    ...highlightPages,
  );

  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}
