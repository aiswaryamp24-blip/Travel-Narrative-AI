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
import type { Photo, Trip, TripDay } from '@workspace/db';
import { ObjectStorageService } from './objectStorage';

const e = React.createElement;

const PRIMARY = '#c2410c';
const INK = '#1c1917';
const MUTED = '#78716c';
const BORDER = '#e7e5e4';
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: INK,
  },
  coverPage: {
    padding: 0,
  },
  coverContainer: {
    position: 'relative',
    width: A4_WIDTH,
    height: A4_HEIGHT,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: A4_WIDTH,
    height: A4_HEIGHT,
    objectFit: 'cover',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: A4_WIDTH,
    padding: 48,
  },
  kicker: {
    fontFamily: 'Courier-Bold',
    fontSize: 9,
    letterSpacing: 3,
    color: PRIMARY,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 40,
    color: '#ffffff',
    textTransform: 'uppercase',
    lineHeight: 1.05,
  },
  coverSubtitle: {
    fontFamily: 'Times-Italic',
    fontSize: 14,
    color: '#ffffff',
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 22,
    marginBottom: 20,
    color: INK,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statBox: {
    width: '47%',
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  statLabel: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: {
    fontFamily: 'Times-Bold',
    fontSize: 20,
    color: INK,
  },
  locationList: {
    marginTop: 24,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  locationText: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  locationMeta: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: MUTED,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayIndex: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    color: PRIMARY,
  },
  dayDate: {
    fontFamily: 'Courier',
    fontSize: 8,
    letterSpacing: 1,
    color: MUTED,
    textTransform: 'uppercase',
  },
  dayHeadline: {
    fontFamily: 'Times-Bold',
    fontSize: 20,
    marginBottom: 14,
    lineHeight: 1.2,
  },
  heroImage: {
    width: '100%',
    height: 240,
    objectFit: 'cover',
    marginBottom: 14,
  },
  narrative: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.6,
    color: '#3f3a37',
    textAlign: 'justify',
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  gridPhoto: {
    width: '48%',
    height: 130,
    objectFit: 'cover',
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

/**
 * Downloads a stored photo and re-encodes it to a print-sized JPEG.
 * Source photos are often full-resolution phone camera originals (several MB
 * each); embedding them untouched produces multi-hundred-MB PDFs and slow
 * generation. Resizing/recompressing here keeps exports fast and reasonably
 * sized while still looking sharp at PDF page dimensions.
 */
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
      .rotate() // apply EXIF orientation before stripping metadata
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    return { data, format: 'jpg' };
  } catch {
    // Unsupported/corrupt image (e.g. unrecognized codec) — skip it rather
    // than failing the whole export.
    return null;
  }
}

function formatTemp(c: number | null | undefined): string | null {
  if (c === null || c === undefined) return null;
  return `${Math.round(c)}°C`;
}

export async function generateTripPdf(
  trip: Trip,
  days: TripDay[],
  photos: Photo[],
): Promise<Buffer> {
  const objectStorageService = new ObjectStorageService();
  const sortedDays = [...days].sort((a, b) => a.dayIndex - b.dayIndex);

  // Prefer the trip's explicit cover photo; fall back to the hero photo of the
  // first day so that older trips (processed before coverObjectPath was set)
  // still get a real photo on their PDF cover instead of a solid colour block.
  const firstDay = sortedDays[0];
  const firstDayHeroPhoto = firstDay
    ? (photos.find((p) => p.id === firstDay.heroPhotoId) ?? null)
    : null;
  const coverPath = trip.coverObjectPath ?? firstDayHeroPhoto?.objectPath ?? null;

  const coverImage = await fetchEmbeddableImage(
    objectStorageService,
    coverPath,
    1600,
  );

  // Pre-fetch every image we intend to embed, in parallel, before rendering.
  const dayImages = await Promise.all(
    sortedDays.map(async (day) => {
      const heroPhoto = photos.find((p) => p.id === day.heroPhotoId) ?? null;
      const gridPhotos = photos
        .filter((p) => p.tripDayId === day.id && p.id !== day.heroPhotoId)
        .slice(0, 4);

      const [hero, grid] = await Promise.all([
        fetchEmbeddableImage(objectStorageService, heroPhoto?.objectPath, 1400),
        Promise.all(
          gridPhotos.map((p) =>
            fetchEmbeddableImage(objectStorageService, p.objectPath, 700),
          ),
        ),
      ]);

      return { day, hero, grid: grid.filter((g): g is NonNullable<typeof g> => !!g) };
    }),
  );

  const totalDistanceKm = sortedDays.reduce(
    (sum, d) => sum + (d.distanceKm ?? 0),
    0,
  );
  const dates = sortedDays.map((d) => d.date).sort();
  const temps = sortedDays
    .map((d) => d.weather?.tempMaxC)
    .filter((t): t is number => typeof t === 'number');
  const lowTemps = sortedDays
    .map((d) => d.weather?.tempMinC)
    .filter((t): t is number => typeof t === 'number');
  const tempRange =
    temps.length > 0 || lowTemps.length > 0
      ? `${formatTemp(Math.min(...lowTemps, ...temps)) ?? '—'} to ${formatTemp(Math.max(...temps, ...lowTemps)) ?? '—'}`
      : null;

  const coverPage = e(
    Page,
    { size: 'A4', style: styles.coverPage },
    e(
      View,
      { style: styles.coverContainer },
      coverImage
        ? e(Image, {
            src: { data: coverImage.data, format: coverImage.format },
            style: styles.coverImage,
          })
        : e(View, { style: { ...styles.coverImage, backgroundColor: '#1c1917' } }),
      e(
        View,
        { style: styles.coverOverlay },
        e(Text, { style: styles.kicker }, 'Turasum'),
        e(Text, { style: styles.coverTitle }, trip.title),
        dates[0] &&
          e(
            Text,
            { style: styles.coverSubtitle },
            `${dates[0]} — ${dates[dates.length - 1]} · ${sortedDays.length} day${sortedDays.length === 1 ? '' : 's'}`,
          ),
      ),
    ),
  );

  const statBoxes: Array<[string, string]> = [
    ['Days', String(sortedDays.length)],
    ['Total Distance', totalDistanceKm > 0 ? `${Math.round(totalDistanceKm)} km` : '—'],
    ['Locations', String(new Set(sortedDays.map((d) => d.locationName).filter(Boolean)).size)],
    ['Temperature Range', tempRange ?? '—'],
  ];

  const statsPage = e(
    Page,
    { size: 'A4', style: styles.page },
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
      { style: styles.locationList },
      e(Text, { style: styles.sectionTitle }, 'Itinerary'),
      ...sortedDays.map((day) =>
        e(
          View,
          { style: styles.locationRow, key: day.id },
          e(
            Text,
            { style: styles.locationText },
            `Day ${String(day.dayIndex).padStart(2, '0')} — ${day.locationName ?? 'Unknown location'}`,
          ),
          e(Text, { style: styles.locationMeta }, day.date),
        ),
      ),
    ),
    e(
      View,
      { style: styles.footer, fixed: true },
      e(Text, {}, trip.title),
      e(
        Text,
        { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` },
      ),
    ),
  );

  const dayPages = dayImages.map(({ day, hero, grid }) =>
    e(
      Page,
      { size: 'A4', style: styles.page, key: day.id },
      e(
        View,
        { style: styles.dayHeader },
        e(Text, { style: styles.dayIndex }, `Day ${String(day.dayIndex).padStart(2, '0')}`),
        e(Text, { style: styles.dayDate }, day.date),
      ),
      day.headline && e(Text, { style: styles.dayHeadline }, day.headline),
      hero && e(Image, { src: { data: hero.data, format: hero.format }, style: styles.heroImage }),
      day.narrative
        ? e(Text, { style: styles.narrative }, stripMarkdown(day.narrative))
        : e(Text, { style: { ...styles.narrative, fontStyle: 'italic', color: MUTED } }, 'No narrative filed for this day.'),
      grid.length > 0 &&
        e(
          View,
          { style: styles.photoGrid },
          ...grid.map((img, i) =>
            e(Image, { key: i, src: { data: img.data, format: img.format }, style: styles.gridPhoto }),
          ),
        ),
      e(
        View,
        { style: styles.footer, fixed: true },
        e(Text, {}, trip.title),
        e(
          Text,
          { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` },
        ),
      ),
    ),
  );

  const doc = e(Document, { title: trip.title }, coverPage, statsPage, ...dayPages);

  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}

/** Strips basic markdown syntax so narrative text reads cleanly as plain PDF text. */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}
