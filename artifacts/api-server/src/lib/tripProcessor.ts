import { db, photosTable, tripDaysTable, tripsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { clusterPhotosByDay } from "./geo";
import { haversineKm } from "./geo";
import { researchAndWriteDay } from "./narrative";
import { logger } from "./logger";

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

    let previousCentroid: { lat: number; lon: number } | null = null;
    let coverObjectPath: string | null = null;
    let firstLocationName: string | null = null;
    let totalDistanceKm = 0;

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const distanceKm = previousCentroid
        ? haversineKm(previousCentroid.lat, previousCentroid.lon, cluster.lat, cluster.lon)
        : null;
      if (distanceKm) totalDistanceKm += distanceKm;
      previousCentroid = { lat: cluster.lat, lon: cluster.lon };

      log.info({ dayIndex: i, date: cluster.date }, "Researching day");

      const story = await researchAndWriteDay({
        dayIndex: i,
        date: cluster.date,
        lat: cluster.lat,
        lon: cluster.lon,
        locationInferred: cluster.locationInferred,
        distanceKm,
        photoCount: cluster.photoIds.length,
        tripTitle: (await getTripTitle(tripId)) ?? "Untitled trip",
      });

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
          distanceKm,
          weather: story.weather,
          landmarks: story.landmarks,
          headline: story.headline,
          narrative: story.narrative,
          heroPhotoId,
        })
        .returning();

      for (const photoId of dayPhotoIds) {
        await db
          .update(photosTable)
          .set({ tripDayId: insertedDay.id })
          .where(eq(photosTable.id, photoId));
      }

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
