import {
  AddTripPhotosBody,
  CreateTripBody,
  UpdateTripPrivacyBody,
  UpdateDayHeroPhotoBody,
  UpdateTripDayNarrativeBody,
  CreateTripCommentBody,
  TagTripCompanionBody,
  RespondToCompanionTagBody,
} from '@workspace/api-zod';
import {
  db,
  photosTable,
  tripDaysTable,
  tripsTable,
  tripCommentsTable,
  tripCompanionsTable,
  followsTable,
  usersTable,
  type Trip,
  type TripDay,
} from '@workspace/db';
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response } from 'express';
import { requireAuth, optionalAuth } from '../middlewares/auth';
import { synthesizeDayNarration } from '../lib/audioNarration';
import { processTrip } from '../lib/tripProcessor';
import { canViewTrip } from '../lib/tripAccess';
import { generateTripPdf } from '../lib/pdfExport';

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
    visualStyle: trip.visualStyle,
    isOwner: false,
    startDate: null as string | null,
    endDate: null as string | null,
    totalDistanceKm: null as number | null,
    createdAt: trip.createdAt.toISOString(),
  };
}

function toTripDayDetail(day: TripDay) {
  return {
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
    aiOriginalHeadline: day.aiOriginalHeadline,
    aiOriginalNarrative: day.aiOriginalNarrative,
    heroPhotoId: day.heroPhotoId,
    audioObjectPath: day.audioObjectPath,
  };
}

// Owners see pending + confirmed tags (so they know who hasn't responded
// yet); everyone else only sees confirmed ones, since a pending tag hasn't
// been agreed to by the tagged user yet.
async function getCompanionList(tripId: number, isOwner: boolean) {
  const rows = await db
    .select({ companion: tripCompanionsTable, user: usersTable })
    .from(tripCompanionsTable)
    .innerJoin(usersTable, eq(tripCompanionsTable.userId, usersTable.id))
    .where(eq(tripCompanionsTable.tripId, tripId));

  return rows
    .filter((r) => isOwner || r.companion.status === 'confirmed')
    .map((r) => ({
      user: { id: r.user.id, displayName: r.user.displayName, avatarUrl: r.user.avatarUrl },
      status: r.companion.status,
    }));
}

router.get('/trips', requireAuth, async (req: Request, res: Response) => {
  const trips = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.userId, req.userId!))
    .orderBy(desc(tripsTable.createdAt));

  const allDays =
    trips.length === 0
      ? []
      : await db
          .select({
            tripId: tripDaysTable.tripId,
            date: tripDaysTable.date,
            distanceKm: tripDaysTable.distanceKm,
          })
          .from(tripDaysTable)
          .where(inArray(tripDaysTable.tripId, trips.map((t) => t.id)));

  const daysByTrip = new Map<number, typeof allDays>();
  for (const day of allDays) {
    const bucket = daysByTrip.get(day.tripId);
    if (bucket) bucket.push(day);
    else daysByTrip.set(day.tripId, [day]);
  }

  const results = trips.map((trip) => {
    const days = daysByTrip.get(trip.id) ?? [];
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
  });

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
    .values({
      title: parsed.data.title,
      userId: req.userId!,
      visualStyle: parsed.data.visualStyle ?? 'canon-camera',
    })
    .returning();

  res.status(201).json({
    ...toTripSummary(trip),
    isOwner: true,
    days: [],
    photos: [],
    companions: [],
  });
});

router.get('/trips/:tripId', optionalAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || !(await canViewTrip(trip, req.userId))) {
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
  const isOwner = !!req.userId && req.userId === trip.userId;

  res.json({
    ...toTripSummary(trip),
    isOwner,
    startDate: dates[0] ?? null,
    endDate: dates[dates.length - 1] ?? null,
    totalDistanceKm,
    days: days.map(toTripDayDetail),
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
    companions: await getCompanionList(tripId, isOwner),
  });
});

router.get(
  '/trips/:tripId/export.pdf',
  optionalAuth,
  async (req: Request, res: Response) => {
    const tripId = Number(req.params.tripId);
    if (!Number.isInteger(tripId)) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
    if (!trip || !(await canViewTrip(trip, req.userId))) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    if (trip.status !== 'ready') {
      res.status(400).json({ error: 'Trip is not ready to export yet' });
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

    try {
      const pdfBuffer = await generateTripPdf(trip, days, photos);
      const filename = `${trip.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'trip'}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      req.log.error({ err: error, tripId }, 'Error generating trip PDF export');
      res.status(500).json({ error: 'Failed to generate PDF export' });
    }
  },
);

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

  // Conditional update: only transition into 'processing' if the trip isn't
  // already processing. This is the atomic guard against a double-dispatch
  // (e.g. a double-click, or a retry fired while the previous run is still
  // in flight) starting two concurrent pipelines against the same trip.
  const [updated] = await db
    .update(tripsTable)
    .set({ status: 'processing', errorMessage: null })
    .where(and(eq(tripsTable.id, tripId), ne(tripsTable.status, 'processing')))
    .returning();

  if (!updated) {
    res.status(409).json({ error: 'Trip is already processing' });
    return;
  }

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
    companions: [],
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
    if (!trip || !(await canViewTrip(trip, req.userId))) {
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
      res.json(toTripDayDetail(day));
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

      res.json(toTripDayDetail(updated));
    } catch (error) {
      req.log.error({ err: error, tripId, dayId }, 'Error synthesizing narration');
      res.status(500).json({ error: 'Failed to synthesize narration' });
    }
  },
);

router.patch(
  '/trips/:tripId/days/:dayId/hero-photo',
  requireAuth,
  async (req: Request, res: Response) => {
    const tripId = Number(req.params.tripId);
    const dayId = Number(req.params.dayId);
    if (!Number.isInteger(tripId) || !Number.isInteger(dayId)) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    const parsed = UpdateDayHeroPhotoBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    const [day] = await db.select().from(tripDaysTable).where(eq(tripDaysTable.id, dayId));
    if (!day || day.tripId !== tripId) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    if (parsed.data.heroPhotoId !== null) {
      const [photo] = await db
        .select()
        .from(photosTable)
        .where(eq(photosTable.id, parsed.data.heroPhotoId));
      if (!photo || photo.tripId !== tripId || photo.tripDayId !== dayId) {
        res.status(400).json({ error: 'Photo does not belong to this day' });
        return;
      }
    }

    const [updated] = await db
      .update(tripDaysTable)
      .set({ heroPhotoId: parsed.data.heroPhotoId })
      .where(eq(tripDaysTable.id, dayId))
      .returning();

    res.json(toTripDayDetail(updated));
  },
);

router.patch(
  '/trips/:tripId/days/:dayId/narrative',
  requireAuth,
  async (req: Request, res: Response) => {
    const tripId = Number(req.params.tripId);
    const dayId = Number(req.params.dayId);
    if (!Number.isInteger(tripId) || !Number.isInteger(dayId)) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    const parsed = UpdateTripDayNarrativeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
    if (!trip || trip.userId !== req.userId) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    const [day] = await db.select().from(tripDaysTable).where(eq(tripDaysTable.id, dayId));
    if (!day || day.tripId !== tripId) {
      res.status(404).json({ error: 'Trip or day not found' });
      return;
    }

    const [updated] = await db
      .update(tripDaysTable)
      .set({ headline: parsed.data.headline, narrative: parsed.data.narrative })
      .where(eq(tripDaysTable.id, dayId))
      .returning();

    res.json(toTripDayDetail(updated));
  },
);

router.get('/trips/:tripId/comments', optionalAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || !(await canViewTrip(trip, req.userId))) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const rows = await db
    .select({ comment: tripCommentsTable, author: usersTable })
    .from(tripCommentsTable)
    .innerJoin(usersTable, eq(tripCommentsTable.userId, usersTable.id))
    .where(eq(tripCommentsTable.tripId, tripId))
    .orderBy(asc(tripCommentsTable.createdAt));

  res.json(
    rows.map(({ comment, author }) => ({
      id: comment.id,
      tripId: comment.tripId,
      userId: comment.userId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: { id: author.id, displayName: author.displayName, avatarUrl: author.avatarUrl },
    })),
  );
});

router.post('/trips/:tripId/comments', requireAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const parsed = CreateTripCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || !(await canViewTrip(trip, req.userId))) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const [comment] = await db
    .insert(tripCommentsTable)
    .values({ tripId, userId: req.userId!, body: parsed.data.body })
    .returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  res.status(201).json({
    id: comment.id,
    tripId: comment.tripId,
    userId: comment.userId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: { id: author.id, displayName: author.displayName, avatarUrl: author.avatarUrl },
  });
});

router.delete(
  '/trips/:tripId/comments/:commentId',
  requireAuth,
  async (req: Request, res: Response) => {
    const tripId = Number(req.params.tripId);
    const commentId = Number(req.params.commentId);
    if (!Number.isInteger(tripId) || !Number.isInteger(commentId)) {
      res.status(404).json({ error: 'Trip or comment not found' });
      return;
    }

    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
    if (!trip) {
      res.status(404).json({ error: 'Trip or comment not found' });
      return;
    }

    const [comment] = await db
      .select()
      .from(tripCommentsTable)
      .where(eq(tripCommentsTable.id, commentId));
    if (!comment || comment.tripId !== tripId) {
      res.status(404).json({ error: 'Trip or comment not found' });
      return;
    }

    // Author or trip owner can delete — lets the owner moderate their own
    // trip's thread without needing every commenter's cooperation.
    if (comment.userId !== req.userId && trip.userId !== req.userId) {
      res.status(404).json({ error: 'Trip or comment not found' });
      return;
    }

    await db.delete(tripCommentsTable).where(eq(tripCommentsTable.id, commentId));

    res.status(204).end();
  },
);

router.post('/trips/:tripId/companions', requireAuth, async (req: Request, res: Response) => {
  const tripId = Number(req.params.tripId);
  if (!Number.isInteger(tripId)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  const parsed = TagTripCompanionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip || trip.userId !== req.userId) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  if (parsed.data.userId === trip.userId) {
    res.status(400).json({ error: 'Cannot tag the trip owner as a companion' });
    return;
  }

  const [target] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, parsed.data.userId));
  if (!target) {
    res.status(400).json({ error: 'User not found' });
    return;
  }

  // The picker only offers people the owner already follows, so a
  // companion tag can't be used to notify/link a stranger.
  const [follow] = await db
    .select({ followerId: followsTable.followerId })
    .from(followsTable)
    .where(and(eq(followsTable.followerId, req.userId!), eq(followsTable.followedId, parsed.data.userId)));
  if (!follow) {
    res.status(400).json({ error: 'You can only tag people you follow' });
    return;
  }

  await db
    .insert(tripCompanionsTable)
    .values({ tripId, userId: parsed.data.userId, status: 'pending' })
    .onConflictDoNothing();

  res.status(201).json(await getCompanionList(tripId, true));
});

router.patch(
  '/trips/:tripId/companions/:userId/respond',
  requireAuth,
  async (req: Request, res: Response) => {
    const tripId = Number(req.params.tripId);
    const userId = String(req.params.userId);
    if (!Number.isInteger(tripId)) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    if (userId !== req.userId) {
      res.status(404).json({ error: 'Companion tag not found' });
      return;
    }

    const parsed = RespondToCompanionTagBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const [companion] = await db
      .select()
      .from(tripCompanionsTable)
      .where(and(eq(tripCompanionsTable.tripId, tripId), eq(tripCompanionsTable.userId, userId)));
    if (!companion) {
      res.status(404).json({ error: 'Companion tag not found' });
      return;
    }

    if (parsed.data.accept) {
      await db
        .update(tripCompanionsTable)
        .set({ status: 'confirmed' })
        .where(and(eq(tripCompanionsTable.tripId, tripId), eq(tripCompanionsTable.userId, userId)));
    } else {
      await db
        .delete(tripCompanionsTable)
        .where(and(eq(tripCompanionsTable.tripId, tripId), eq(tripCompanionsTable.userId, userId)));
    }

    res.json(await getCompanionList(tripId, trip.userId === req.userId));
  },
);

router.delete(
  '/trips/:tripId/companions/:userId',
  requireAuth,
  async (req: Request, res: Response) => {
    const tripId = Number(req.params.tripId);
    const userId = String(req.params.userId);
    if (!Number.isInteger(tripId)) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    // Trip owner un-tags anyone, or a companion removes their own tag —
    // mirroring "leaving a photo tag" rather than needing the owner's help.
    if (trip.userId !== req.userId && userId !== req.userId) {
      res.status(404).json({ error: 'Companion tag not found' });
      return;
    }

    await db
      .delete(tripCompanionsTable)
      .where(and(eq(tripCompanionsTable.tripId, tripId), eq(tripCompanionsTable.userId, userId)));

    res.json(await getCompanionList(tripId, trip.userId === req.userId));
  },
);

export default router;
