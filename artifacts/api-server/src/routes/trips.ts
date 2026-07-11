import {
  AddTripPhotosBody,
  CreateTripBody,
  UpdateTripPrivacyBody,
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
import { requireAuth, optionalAuth } from '../middlewares/auth';
import { synthesizeDayNarration } from '../lib/audioNarration';
import { processTrip } from '../lib/tripProcessor';
import { canViewTrip } from '../lib/tripAccess';

const router: IRouter = Router();

function toTripSummary(trip: Trip) {
  return {
    id: trip.id,
    title: trip.title,
    status: trip.status,
    coverObjectPath: trip.coverObjectPath,
    summary: trip.summary,
    errorMessage: trip.errorMessage,
    privacy: trip.privacy,
    isOwner: false,
    startDate: null as string | null,
    endDate: null as string | null,
    totalDistanceKm: null as number | null,
    createdAt: trip.createdAt.toISOString(),
  };
}

router.get('/trips', requireAuth, async (req: Request, res: Response) => {
  const trips = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.userId, req.userId!))
    .orderBy(desc(tripsTable.createdAt));

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
        isOwner: true,
        startDate: dates[0] ?? null,
        endDate: dates[dates.length - 1] ?? null,
        totalDistanceKm,
      };
    }),
  );

  res.json(results);
});

router.post('/trips', requireAuth, async (req: Request, res: Response) => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }

  const [trip] = await db
    .insert(tripsTable)
    .values({ title: parsed.data.title, userId: req.userId! })
    .returning();

  res.status(201).json({
    ...toTripSummary(trip),
    isOwner: true,
    days: [],
    photos: [],
  });
});

router.get('/trips/:tripId', optionalAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || !canViewTrip(trip, req.userId)) {
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
    isOwner: !!req.userId && req.userId === trip.userId,
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
      audioObjectPath: d.audioObjectPath,
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

router.patch('/trips/:tripId/privacy', requireAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const parsed = UpdateTripPrivacyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || trip.userId !== req.userId) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [updated] = await db
    .update(tripsTable)
    .set({ privacy: parsed.data.privacy })
    .where(eq(tripsTable.id, tripId))
    .returning();

  res.json({
    ...toTripSummary(updated),
    isOwner: true,
    startDate: null,
    endDate: null,
    totalDistanceKm: null,
  });
});

router.delete('/trips/:tripId', requireAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || trip.userId !== req.userId) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  await db.delete(tripsTable).where(eq(tripsTable.id, tripId));

  res.status(204).end();
});

router.post('/trips/:tripId/photos', requireAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || trip.userId !== req.userId) {
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

router.post('/trips/:tripId/process', requireAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || trip.userId !== req.userId) {
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
    isOwner: true,
    startDate: null,
    endDate: null,
    totalDistanceKm: null,
    days: [],
    photos: [],
  });
});

router.post(
  '/trips/:tripId/days/:dayId/narration',
  optionalAuth,
  async (req: Request, res: Response) => {
    const tripId = Number(req.params.tripId);
    const dayId = Number(req.params.dayId);
    if (!Number.isInteger(tripId) || !Number.isInteger(dayId)) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
    if (!trip || !canViewTrip(trip, req.userId)) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    const [day] = await db
      .select()
      .from(tripDaysTable)
      .where(eq(tripDaysTable.id, dayId));

    if (!day || day.tripId !== tripId) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    if (day.audioObjectPath) {
      res.json({
        id: day.id,
        tripId: day.tripId,
        dayIndex: day.dayIndex,
        date: day.date,
        locationName: day.locationName,
        lat: day.lat,
        lon: day.lon,
        elevationMeters: day.elevationMeters,
        distanceKm: day.distanceKm,
        weather: day.weather,
        landmarks: day.landmarks,
        headline: day.headline,
        narrative: day.narrative,
        heroPhotoId: day.heroPhotoId,
        audioObjectPath: day.audioObjectPath,
      });
      return;
    }

    if (!day.headline || !day.narrative) {
      res.status(400).json({ error: 'Day has no narrative to narrate yet' });
      return;
    }

    try {
      const audioObjectPath = await synthesizeDayNarration(
        day.headline,
        day.narrative,
      );

      const [updated] = await db
        .update(tripDaysTable)
        .set({ audioObjectPath })
        .where(eq(tripDaysTable.id, dayId))
        .returning();

      res.json({
        id: updated.id,
        tripId: updated.tripId,
        dayIndex: updated.dayIndex,
        date: updated.date,
        locationName: updated.locationName,
        lat: updated.lat,
        lon: updated.lon,
        elevationMeters: updated.elevationMeters,
        distanceKm: updated.distanceKm,
        weather: updated.weather,
        landmarks: updated.landmarks,
        headline: updated.headline,
        narrative: updated.narrative,
        heroPhotoId: updated.heroPhotoId,
        audioObjectPath: updated.audioObjectPath,
      });
    } catch (error) {
      req.log.error({ err: error, tripId, dayId }, 'Error synthesizing narration');
      res.status(500).json({ error: 'Failed to synthesize narration' });
    }
  },
);

export default router;
