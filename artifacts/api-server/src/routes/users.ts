import { UpdateUserSettingsBody } from '@workspace/api-zod';
import {
  db,
  digestCadenceMonthsValues,
  digestStyleValues,
  followsTable,
  tripsTable,
  usersTable,
  type Trip,
  type User,
} from '@workspace/db';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response } from 'express';
import { requireAuth, optionalAuth } from '../middlewares/auth';

const router: IRouter = Router();

function toUserSummary(user: User) {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

function toTripSummary(trip: Trip, isOwner: boolean) {
  return {
    id: trip.id,
    title: trip.title,
    status: trip.status,
    coverObjectPath: trip.coverObjectPath,
    summary: trip.summary,
    errorMessage: trip.errorMessage,
    privacy: trip.privacy,
    visualStyle: trip.visualStyle,
    isOwner,
    startDate: null as string | null,
    endDate: null as string | null,
    totalDistanceKm: null as number | null,
    createdAt: trip.createdAt.toISOString(),
  };
}

async function isFollowing(followerId: string, followedId: string): Promise<boolean> {
  const [row] = await db
    .select({ followerId: followsTable.followerId })
    .from(followsTable)
    .where(
      and(eq(followsTable.followerId, followerId), eq(followsTable.followedId, followedId)),
    );
  return !!row;
}

router.get('/users/:userId', optionalAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  const [profileUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!profileUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const isSelf = !!req.userId && req.userId === userId;
  const viewerFollows =
    !isSelf && req.userId ? await isFollowing(req.userId, userId) : false;

  const [allTrips, [{ followerCount }], [{ followingCount }]] = await Promise.all([
    db.select().from(tripsTable).where(eq(tripsTable.userId, userId)),
    db
      .select({ followerCount: sql<number>`count(*)::int` })
      .from(followsTable)
      .where(eq(followsTable.followedId, userId)),
    db
      .select({ followingCount: sql<number>`count(*)::int` })
      .from(followsTable)
      .where(eq(followsTable.followerId, userId)),
  ]);

  const visibleTrips = allTrips
    .filter((trip) => {
      if (isSelf) return true;
      if (trip.privacy === 'public') return true;
      if (trip.privacy === 'friends') return viewerFollows;
      return false;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((trip) => toTripSummary(trip, isSelf));

  res.json({
    ...toUserSummary(profileUser),
    isSelf,
    isFollowing: viewerFollows,
    followerCount,
    followingCount,
    trips: visibleTrips,
    digestCadenceMonths: profileUser.digestCadenceMonths,
    preferredDigestStyle: profileUser.preferredDigestStyle,
  });
});

router.patch('/users/:userId/settings', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  if (userId !== req.userId) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const parsed = UpdateUserSettingsBody.safeParse(req.body);
  if (!parsed.success || !digestCadenceMonthsValues.includes(parsed.data.digestCadenceMonths as any)) {
    res.status(400).json({ error: 'Missing or invalid required fields' });
    return;
  }

  // Optional style preference update — ignore unknown values rather than erroring.
  const preferredDigestStyle =
    parsed.data.preferredDigestStyle &&
    digestStyleValues.includes(parsed.data.preferredDigestStyle as any)
      ? (parsed.data.preferredDigestStyle as string)
      : undefined;

  const [updated] = await db
    .update(usersTable)
    .set({
      digestCadenceMonths: parsed.data.digestCadenceMonths,
      ...(preferredDigestStyle !== undefined ? { preferredDigestStyle } : {}),
    })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const [{ followerCount }] = await db
    .select({ followerCount: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followedId, userId));
  const [{ followingCount }] = await db
    .select({ followingCount: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));
  const allTrips = await db.select().from(tripsTable).where(eq(tripsTable.userId, userId));
  const trips = allTrips
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((trip) => toTripSummary(trip, true));

  res.json({
    ...toUserSummary(updated),
    isSelf: true,
    isFollowing: false,
    followerCount,
    followingCount,
    trips,
    digestCadenceMonths: updated.digestCadenceMonths,
    preferredDigestStyle: updated.preferredDigestStyle,
  });
});

router.post('/users/:userId/follow', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  if (userId === req.userId) {
    res.status(400).json({ error: 'Cannot follow yourself' });
    return;
  }

  const [target] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId));
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await db
    .insert(followsTable)
    .values({ followerId: req.userId!, followedId: userId })
    .onConflictDoNothing();

  res.json({ isFollowing: true });
});

router.delete('/users/:userId/follow', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  const [target] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId));
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await db
    .delete(followsTable)
    .where(and(eq(followsTable.followerId, req.userId!), eq(followsTable.followedId, userId)));

  res.json({ isFollowing: false });
});

router.get('/feed', requireAuth, async (req: Request, res: Response) => {
  const followedRows = await db
    .select({ followedId: followsTable.followedId })
    .from(followsTable)
    .where(eq(followsTable.followerId, req.userId!));
  const followedIds = followedRows.map((r) => r.followedId);

  if (followedIds.length === 0) {
    res.json([]);
    return;
  }

  const trips = await db
    .select()
    .from(tripsTable)
    .where(inArray(tripsTable.userId, followedIds));

  const visible = trips.filter((t) => t.privacy === 'public' || t.privacy === 'friends');
  const owners = await db.select().from(usersTable).where(inArray(usersTable.id, followedIds));
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  const results = visible
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((trip) => ({
      ...toTripSummary(trip, false),
      owner: toUserSummary(ownerById.get(trip.userId!)!),
    }));

  res.json(results);
});

router.get('/followers-feed', requireAuth, async (req: Request, res: Response) => {
  const followerRows = await db
    .select({ followerId: followsTable.followerId })
    .from(followsTable)
    .where(eq(followsTable.followedId, req.userId!));
  const followerIds = followerRows.map((r) => r.followerId);

  if (followerIds.length === 0) {
    res.json([]);
    return;
  }

  // Being followed by someone doesn't mean you follow them back, so their
  // friends-tier trips aren't automatically visible — only their public
  // trips are, unless you also follow them (in which case those
  // friends-tier trips already show up in the Following feed too).
  const myFollowedRows = await db
    .select({ followedId: followsTable.followedId })
    .from(followsTable)
    .where(eq(followsTable.followerId, req.userId!));
  const myFollowedIds = new Set(myFollowedRows.map((r) => r.followedId));

  const trips = await db
    .select()
    .from(tripsTable)
    .where(inArray(tripsTable.userId, followerIds));

  const visible = trips.filter(
    (t) => t.privacy === 'public' || (t.privacy === 'friends' && t.userId != null && myFollowedIds.has(t.userId)),
  );
  const owners = await db.select().from(usersTable).where(inArray(usersTable.id, followerIds));
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  const results = visible
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((trip) => ({
      ...toTripSummary(trip, false),
      owner: toUserSummary(ownerById.get(trip.userId!)!),
    }));

  res.json(results);
});

// optionalAuth (not requireAuth): this also powers the logged-out public
// Explore page, so anonymous visitors see every public trip. Signed-in
// visitors additionally get trips they already follow (and their own)
// excluded, since those already show up in their "Following" feed.
router.get('/discover', optionalAuth, async (req: Request, res: Response) => {
  const followedRows = req.userId
    ? await db
        .select({ followedId: followsTable.followedId })
        .from(followsTable)
        .where(eq(followsTable.followerId, req.userId))
    : [];
  const excludedIds = new Set(
    req.userId ? [...followedRows.map((r) => r.followedId), req.userId] : [],
  );

  const trips = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.privacy, 'public'));

  const discoverable = trips.filter((t) => t.userId && !excludedIds.has(t.userId));
  const ownerIds = [...new Set(discoverable.map((t) => t.userId!))];
  const owners = ownerIds.length
    ? await db.select().from(usersTable).where(inArray(usersTable.id, ownerIds))
    : [];
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  const results = discoverable
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((trip) => ({
      ...toTripSummary(trip, false),
      owner: toUserSummary(ownerById.get(trip.userId!)!),
    }));

  res.json(results);
});

export default router;
