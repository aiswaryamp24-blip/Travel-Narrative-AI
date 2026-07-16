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
      height: 8,
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

/** Render style-specific cover decorations */
function renderCoverDecorations(styleId: DigestStyleId, styles: ReturnType<typeof buildStyles>) {
  switch (styleId) {
    case 'pop-art':
      return e(View, { style: styles.popArtBorder });
    case 'supermarket':
      // Barcode stripes at bottom
      return e(
        View,
        { style: { position: 'absolute', bottom: 56, left: 56 } },
        e(
          View,
          { style: styles.supermarketStripes },
          ...[4, 2, 5, 1, 3, 2, 4, 1, 3, 5, 2, 4, 1, 3, 2, 5, 1, 4, 2, 3].map((w, i) =>
            e(View, { key: i, style: { ...styles.supermarketStripe, width: w * 3 } }),
          ),
        ),
      );
    case 'camera-interface':
    case 'canon-camera':
      return e(
        React.Fragment,
        {},
        e(View, { style: styles.hudCornerTL }),
        e(View, { style: styles.hudCornerBR }),
      );
    case 'ios-core':
    case 'android-core':
      return null;
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
  const preset = DIGEST_STYLES[styleId] ?? DIGEST_STYLES[DEFAULT_DIGEST_STYLE];
  const styles = buildStyles(preset);

  const objectStorageService = new ObjectStorageService();

  const allDays = bundles.flatMap((b) => b.days);
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

  const coverDecorations = renderCoverDecorations(styleId, styles);

  const coverPage = e(
    Page,
    { size: 'A4', style: styles.coverPage },
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
    coverDecorations,
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
    ...highlightPages,
  );

  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}
