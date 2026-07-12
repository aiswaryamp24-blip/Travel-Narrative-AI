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

const e = React.createElement;

// A distinct "wrapped"-style recap identity — dark canvas + amber accent —
// deliberately different from the warm paper/editorial look of the
// full-trip PDF export (pdfExport.ts) so a digest reads as its own thing.
const INK = '#0f172a';
const INK_LIGHT = '#1e293b';
const ACCENT = '#f59e0b';
const MUTED = '#94a3b8';
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

const styles = StyleSheet.create({
  coverPage: {
    backgroundColor: INK,
    padding: 0,
  },
  coverContainer: {
    width: A4_WIDTH,
    height: A4_HEIGHT,
    padding: 56,
    justifyContent: 'space-between',
  },
  kicker: {
    fontFamily: 'Courier-Bold',
    fontSize: 10,
    letterSpacing: 4,
    color: ACCENT,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 54,
    color: '#ffffff',
    lineHeight: 1.05,
    marginTop: 20,
  },
  coverSubtitle: {
    fontFamily: 'Times-Italic',
    fontSize: 16,
    color: MUTED,
    marginTop: 16,
  },
  coverFooter: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: 'uppercase',
  },
  statsPage: {
    backgroundColor: INK,
    padding: 56,
    color: '#ffffff',
  },
  sectionTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 24,
    color: '#ffffff',
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
    borderColor: INK_LIGHT,
    backgroundColor: INK_LIGHT,
    padding: 18,
  },
  statLabel: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Times-Bold',
    fontSize: 32,
    color: ACCENT,
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
    backgroundColor: INK,
  },
  highlightOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: A4_WIDTH,
    padding: 48,
  },
  highlightKicker: {
    fontFamily: 'Courier-Bold',
    fontSize: 9,
    letterSpacing: 3,
    color: ACCENT,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  highlightTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 30,
    color: '#ffffff',
    lineHeight: 1.1,
  },
  highlightHeadline: {
    fontFamily: 'Times-Italic',
    fontSize: 14,
    color: '#e2e8f0',
    marginTop: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: 'Courier',
    fontSize: 8,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

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

/**
 * Generates a "wrapped"-style recap PDF covering a set of a user's completed
 * trips within a period: a cover, an aggregate stats page, then one
 * full-bleed highlight page per trip (cover photo + headline) rather than
 * the full day-by-day breakdown a single-trip export gives.
 */
export async function generateDigestPdf(
  user: User,
  periodStart: Date,
  periodEnd: Date,
  bundles: DigestTripBundle[],
): Promise<Buffer> {
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
        `${bundles.length} trip${bundles.length === 1 ? '' : 's'} filed this season`,
      ),
    ),
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
          e(Text, { style: styles.highlightKicker }, 'Featured Dispatch'),
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
