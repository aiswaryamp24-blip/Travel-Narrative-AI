import {
  AddTripPhotosBody,
  CreateTripBody,
} from '@workspace/api-zod';
import {
  db,
  photosTable,
  tripDaysTable,
  tripsTable,
  type Trip,
} from '@workspace/db';
import { asc, desc, eq } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response } from 'express';
import { processTrip } from '../lib/tripProcessor';

const router: IRouter = Router();

function toTripSummary(trip: Trip) {
  return {
    id: trip.id,
    title: trip.title,
    status: trip.status,
    coverObjectPath: trip.coverObjectPath,
    summary: trip.summary,
    errorMessage: trip.errorMessage,
    startDate: null as string | null,
    endDate: null as string | null,
    totalDistanceKm: null as number | null,
    createdAt: trip.createdAt.toISOString(),
  };
}

router.get('/trips', async (_req: Request, res: Response) => {
  const trips = await db.select().from(tripsTable).orderBy(desc(tripsTable.createdAt));

  const results = await Promise.all(
    trips.map(async (trip) => {
      const days = await db
        .select()
        .from(tripDaysTable)
        .where(eq(tripDaysTable.tripId, trip.id))
        .orderBy(asc(tripDaysTable.dayIndex));

      const dates = days.map((d) => d.date).sort();
      const totalDistanceKm =
        days.length > 0
          ? days.reduce((sum, d) => sum + (d.distanceKm ?? 0), 0)
          : null;

      return {
        ...toTripSummary(trip),
        startDate: dates[0] ?? null,
        endDate: dates[dates.length - 1] ?? null,
        totalDistanceKm,
      };
    }),
  );

  res.json(results);
});

router.post('/trips', async (req: Request, res: Response) => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }

  const [trip] = await db
    .insert(tripsTable)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json({
    ...toTripSummary(trip),
    days: [],
    photos: [],
  });
});

router.get('/trips/:tripId', async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [days, photos] = await Promise.all([
    db
      .select()
      .from(tripDaysTable)
      .where(eq(tripDaysTable.tripId, tripId))
      .orderBy(asc(tripDaysTable.dayIndex)),
    db.select().from(photosTable).where(eq(photosTable.tripId, tripId)),
  ]);

  const dates = days.map((d) => d.date).sort();
  const totalDistanceKm =
    days.length > 0 ? days.reduce((sum, d) => sum + (d.distanceKm ?? 0), 0) : null;

  res.json({
    ...toTripSummary(trip),
    startDate: dates[0] ?? null,
    endDate: dates[dates.length - 1] ?? null,
    totalDistanceKm,
    days: days.map((d) => ({
      id: d.id,
      tripId: d.tripId,
      dayIndex: d.dayIndex,
      date: d.date,
      locationName: d.locationName,
      lat: d.lat,
      lon: d.lon,
      elevationMeters: d.elevationMeters,
      distanceKm: d.distanceKm,
      weather: d.weather,
      landmarks: d.landmarks,
      headline: d.headline,
      narrative: d.narrative,
      heroPhotoId: d.heroPhotoId,
    })),
    photos: photos.map((p) => ({
      id: p.id,
      tripId: p.tripId,
      objectPath: p.objectPath,
      filename: p.filename,
      lat: p.lat,
      lon: p.lon,
      takenAt: p.takenAt ? p.takenAt.toISOString() : null,
      tripDayId: p.tripDayId,
    })),
  });
});

router.delete('/trips/:tripId', async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const deleted = await db
    .delete(tripsTable)
    .where(eq(tripsTable.id, tripId))
    .returning({ id: tripsTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  res.status(204).end();
});

router.post('/trips/:tripId/photos', async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const parsed = AddTripPhotosBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }

  const inserted = await db
    .insert(photosTable)
    .values(
      parsed.data.photos.map((p) => ({
        tripId,
        objectPath: p.objectPath,
        filename: p.filename,
        lat: p.lat ?? null,
        lon: p.lon ?? null,
        takenAt: p.takenAt ? new Date(p.takenAt) : null,
      })),
    )
    .returning();

  res.status(201).json(
    inserted.map((p) => ({
      id: p.id,
      tripId: p.tripId,
      objectPath: p.objectPath,
      filename: p.filename,
      lat: p.lat,
      lon: p.lon,
      takenAt: p.takenAt ? p.takenAt.toISOString() : null,
      tripDayId: p.tripDayId,
    })),
  );
});

router.post('/trips/:tripId/process', async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const photoCount = await db
    .select({ id: photosTable.id })
    .from(photosTable)
    .where(eq(photosTable.tripId, tripId));

  if (photoCount.length === 0) {
    res.status(400).json({ error: 'Trip has no photos to process' });
    return;
  }

  const [updated] = await db
    .update(tripsTable)
    .set({ status: 'processing', errorMessage: null })
    .where(eq(tripsTable.id, tripId))
    .returning();

  // Fire-and-forget: the pipeline makes multiple slow external + Claude
  // calls per day, so we don't await it in the HTTP response. The frontend
  // polls GET /trips/:tripId for status transitions.
  processTrip(tripId).catch((error) => {
    req.log.error({ err: error, tripId }, 'Unhandled error in processTrip');
  });

  res.status(202).json({
    ...toTripSummary(updated),
    startDate: null,
    endDate: null,
    totalDistanceKm: null,
    days: [],
    photos: [],
  });
});

export default router;
