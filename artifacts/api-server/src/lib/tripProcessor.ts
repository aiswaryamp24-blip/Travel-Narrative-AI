import { db, photosTable, tripDaysTable, tripsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { clusterPhotosByDay, computeDayDistanceKm, type RoutePoint } from "./geo";
import { researchAndWriteDay, type DayStoryResult, type PhotoImage } from "./narrative";
import { logger } from "./logger";
import { ObjectStorageService } from "./objectStorage";

const objectStorageService = new ObjectStorageService();

/** How many photos from each day are actually shown to the model for
 * visual grounding — enough to capture the day's variety without blowing
 * up token/latency budgets. */
const MAX_PHOTOS_PER_DAY_FOR_VISION = 4;

function guessMediaType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

/** Downloads a handful of a day's photos and base64-encodes them so the
 * narrative model can describe what's actually in them, instead of writing
 * purely from GPS/weather/landmark metadata. */
async function loadPhotoImagesForDay(
  photos: Array<{ id: number; objectPath: string; filename: string }>,
  photoIds: number[],
): Promise<PhotoImage[]> {
  const chosenIds = photoIds.slice(0, MAX_PHOTOS_PER_DAY_FOR_VISION);
  const byId = new Map(photos.map((p) => [p.id, p]));

  const images = await Promise.all(
    chosenIds.map(async (id) => {
      const photo = byId.get(id);
      if (!photo) return null;
      try {
        const file = await objectStorageService.getObjectEntityFile(photo.objectPath);
        const [buffer] = await file.download();
        return {
          base64: buffer.toString("base64"),
          mediaType: guessMediaType(photo.filename),
        } satisfies PhotoImage;
      } catch {
        // A missing/unreadable photo shouldn't fail the whole day's story —
        // it just won't contribute visual grounding.
        return null;
      }
    }),
  );

  return images.filter((img): img is PhotoImage => img != null);
}

/** How many days are researched concurrently. Bounded (rather than unbounded
 * Promise.all) because the research pipeline calls Nominatim and Overpass,
 * whose usage policies for their free public instances prohibit bulk
 * parallel requests. */
const RESEARCH_CONCURRENCY = 3;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Runs the full research + narrative pipeline for a trip: clusters photos
 * into days, researches + writes each day via Claude tool-calling, persists
 * trip_days rows, links photos to their day, and finally marks the trip
 * ready (or error). Intended to be fired-and-forgotten from the
 * POST /trips/:id/process route — callers should poll GET /trips/:id.
 */
export async function processTrip(tripId: number): Promise<void> {
  const log = logger.child({ tripId, task: "processTrip" });

  try {
    // Clear any trip_days from a previous run of this trip (e.g. a retry
    // after a partial failure) so reprocessing doesn't leave duplicate day
    // rows behind — every run starts from a clean slate.
    await db.delete(tripDaysTable).where(eq(tripDaysTable.tripId, tripId));
    await db
      .update(photosTable)
      .set({ tripDayId: null })
      .where(eq(photosTable.tripId, tripId));

    const photos = await db
      .select()
      .from(photosTable)
      .where(eq(photosTable.tripId, tripId));

    if (photos.length === 0) {
      throw new Error("Trip has no photos to process");
    }

    const clusters = clusterPhotosByDay(
      photos.map((p) => ({ id: p.id, lat: p.lat, lon: p.lon, takenAt: p.takenAt })),
    );

    if (clusters.length === 0) {
      throw new Error(
        "None of this trip's photos have a capture date, so no days could be identified",
      );
    }

    const tripTitle = (await getTripTitle(tripId)) ?? "Untitled trip";

    // Distance is estimated from the actual chronological trail of
    // geotagged photos (intra-day movement + the arrival leg from the
    // previous day's last point), not just a single centroid-to-centroid
    // hop per day — that collapsed an entire day of sightseeing into one
    // averaged point and badly understated real movement.
    let previousLastPoint: RoutePoint | null = null;
    let totalDistanceKm = 0;
    const distancesKm: (number | null)[] = clusters.map((cluster) => {
      const distanceKm = computeDayDistanceKm(previousLastPoint, cluster.routePoints);
      if (distanceKm) totalDistanceKm += distanceKm;
      if (cluster.routePoints.length > 0) {
        previousLastPoint = cluster.routePoints[cluster.routePoints.length - 1];
      }
      return distanceKm;
    });

    const stories: DayStoryResult[] = await mapWithConcurrency(
      clusters,
      RESEARCH_CONCURRENCY,
      async (cluster, i) => {
        log.info({ dayIndex: i, date: cluster.date }, "Researching day");
        const photoImages = await loadPhotoImagesForDay(photos, cluster.photoIds);
        const story = await researchAndWriteDay({
          dayIndex: i,
          date: cluster.date,
          lat: cluster.lat,
          lon: cluster.lon,
          locationInferred: cluster.locationInferred,
          distanceKm: distancesKm[i],
          photoCount: cluster.photoIds.length,
          photoImages,
          tripTitle,
        });
        log.info({ dayIndex: i }, "Day research complete");
        return story;
      },
    );

    let coverObjectPath: string | null = null;
    let firstLocationName: string | null = null;

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const story = stories[i];

      if (i === 0) firstLocationName = story.locationName;

      const dayPhotoIds = cluster.photoIds;
      const heroPhotoId = dayPhotoIds[0] ?? null;

      const [insertedDay] = await db
        .insert(tripDaysTable)
        .values({
          tripId,
          dayIndex: i,
          date: cluster.date,
          locationName: story.locationName,
          lat: cluster.lat,
          lon: cluster.lon,
          elevationMeters: story.elevationMeters,
          distanceKm: distancesKm[i],
          routePoints: cluster.routePoints,
          weather: story.weather,
          landmarks: story.landmarks,
          headline: story.headline,
          narrative: story.narrative,
          heroPhotoId,
        })
        .returning();

      await db
        .update(photosTable)
        .set({ tripDayId: insertedDay.id })
        .where(inArray(photosTable.id, dayPhotoIds));

      if (i === 0 && heroPhotoId != null) {
        const heroPhoto = photos.find((p) => p.id === heroPhotoId);
        coverObjectPath = heroPhoto?.objectPath ?? null;
      }
    }

    const summary =
      clusters.length === 1
        ? `A single day in ${firstLocationName ?? "an unknown location"}.`
        : `${clusters.length} days across ${totalDistanceKm.toFixed(0)} km, starting in ${firstLocationName ?? "an unknown location"}.`;

    await db
      .update(tripsTable)
      .set({
        status: "ready",
        coverObjectPath,
        summary,
        errorMessage: null,
      })
      .where(eq(tripsTable.id, tripId));

    log.info("Trip processing complete");
  } catch (error) {
    log.error({ err: error }, "Trip processing failed");
    await db
      .update(tripsTable)
      .set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(tripsTable.id, tripId));
  }
}

async function getTripTitle(tripId: number): Promise<string | null> {
  const [trip] = await db
    .select({ title: tripsTable.title })
    .from(tripsTable)
    .where(eq(tripsTable.id, tripId));
  return trip?.title ?? null;
}
