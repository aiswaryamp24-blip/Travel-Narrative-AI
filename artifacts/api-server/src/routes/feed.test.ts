import { db, followsTable, tripsTable, usersTable } from '@workspace/db';
import { and, eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app';

// ── Stable test-user IDs ──────────────────────────────────────────────────────
// Prefixed with "user_test_feed_" to avoid collisions with other test files.
const ME = 'user_test_feed_me';           // the authenticated viewer
const FOLLOWED = 'user_test_feed_followed'; // ME follows this user
const FOLLOWER = 'user_test_feed_follower'; // this user follows ME (not vice-versa by default)
const MUTUAL = 'user_test_feed_mutual';    // ME follows + is followed by (mutual)
const STRANGER = 'user_test_feed_stranger'; // ME has no relationship with

const ALL_USERS = [ME, FOLLOWED, FOLLOWER, MUTUAL, STRANGER];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createTrip(
  userId: string,
  privacy: 'public' | 'friends' | 'private',
  title: string,
): Promise<number> {
  const [trip] = await db
    .insert(tripsTable)
    .values({ userId, privacy, title, status: 'ready' })
    .returning({ id: tripsTable.id });
  return trip.id;
}

async function follow(followerId: string, followedId: string) {
  await db
    .insert(followsTable)
    .values({ followerId, followedId })
    .onConflictDoNothing();
}

// ── Fixture IDs (populated in beforeAll) ────────────────────────────────────
let followedPublic: number;
let followedFriends: number;
let followedPrivate: number;
let followerPublic: number;
let followerFriends: number;
let mutualPublic: number;
let mutualFriends: number;
let strangerPublic: number;
let myOwnPublic: number;

beforeAll(async () => {
  // Insert users (idempotent – real tests share the dev DB)
  await db
    .insert(usersTable)
    .values(ALL_USERS.map((id) => ({ id, displayName: id })))
    .onConflictDoNothing();

  // ME follows FOLLOWED and MUTUAL
  await follow(ME, FOLLOWED);
  await follow(ME, MUTUAL);

  // FOLLOWER and MUTUAL follow ME
  await follow(FOLLOWER, ME);
  await follow(MUTUAL, ME);

  // Create trips
  followedPublic  = await createTrip(FOLLOWED, 'public',  'followed-public');
  followedFriends = await createTrip(FOLLOWED, 'friends', 'followed-friends');
  followedPrivate = await createTrip(FOLLOWED, 'private', 'followed-private');

  followerPublic  = await createTrip(FOLLOWER, 'public',  'follower-public');
  followerFriends = await createTrip(FOLLOWER, 'friends', 'follower-friends');

  mutualPublic    = await createTrip(MUTUAL, 'public',   'mutual-public');
  mutualFriends   = await createTrip(MUTUAL, 'friends',  'mutual-friends');

  strangerPublic  = await createTrip(STRANGER, 'public', 'stranger-public');
  myOwnPublic     = await createTrip(ME, 'public',       'my-own-public');
});

afterAll(async () => {
  const tripIds = [
    followedPublic, followedFriends, followedPrivate,
    followerPublic, followerFriends,
    mutualPublic, mutualFriends,
    strangerPublic, myOwnPublic,
  ].filter(Boolean);

  if (tripIds.length) {
    await db.delete(tripsTable).where(inArray(tripsTable.id, tripIds));
  }

  // Delete follows before users (FK)
  await db.delete(followsTable).where(
    and(
      inArray(followsTable.followerId, ALL_USERS),
    ),
  );
  await db.delete(followsTable).where(
    inArray(followsTable.followedId, ALL_USERS),
  );

  await db.delete(usersTable).where(inArray(usersTable.id, ALL_USERS));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feed  (trips from users ME follows)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/feed', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/feed');
    expect(res.status).toBe(401);
  });

  it('includes public and friends trips from followed users', async () => {
    const res = await request(app).get('/api/feed').set('x-test-user-id', ME);
    expect(res.status).toBe(200);

    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    // FOLLOWED's public and friends trips should appear
    expect(ids).toContain(followedPublic);
    expect(ids).toContain(followedFriends);

    // MUTUAL's public and friends trips should appear (ME follows MUTUAL)
    expect(ids).toContain(mutualPublic);
    expect(ids).toContain(mutualFriends);
  });

  it('excludes private trips from followed users', async () => {
    const res = await request(app).get('/api/feed').set('x-test-user-id', ME);
    expect(res.status).toBe(200);

    const ids: number[] = res.body.map((t: { id: number }) => t.id);
    expect(ids).not.toContain(followedPrivate);
  });

  it("excludes trips from users ME doesn't follow", async () => {
    const res = await request(app).get('/api/feed').set('x-test-user-id', ME);
    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    // FOLLOWER follows ME but ME doesn't follow FOLLOWER
    expect(ids).not.toContain(followerPublic);
    expect(ids).not.toContain(followerFriends);

    // STRANGER has no relationship with ME at all
    expect(ids).not.toContain(strangerPublic);
  });

  it("excludes ME's own trips from the feed", async () => {
    const res = await request(app).get('/api/feed').set('x-test-user-id', ME);
    const ids: number[] = res.body.map((t: { id: number }) => t.id);
    expect(ids).not.toContain(myOwnPublic);
  });

  it('returns an empty array when ME follows nobody', async () => {
    // Use STRANGER who has no follows
    const res = await request(app).get('/api/feed').set('x-test-user-id', STRANGER);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('includes owner info on each trip', async () => {
    const res = await request(app).get('/api/feed').set('x-test-user-id', ME);
    const feedTrip = res.body.find((t: { id: number }) => t.id === followedPublic);
    expect(feedTrip).toBeDefined();
    expect(feedTrip.owner).toMatchObject({ id: FOLLOWED });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/followers-feed  (trips from users who follow ME)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/followers-feed', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/followers-feed');
    expect(res.status).toBe(401);
  });

  it('includes public trips from all followers', async () => {
    const res = await request(app)
      .get('/api/followers-feed')
      .set('x-test-user-id', ME);
    expect(res.status).toBe(200);

    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    // FOLLOWER follows ME → their public trip should appear
    expect(ids).toContain(followerPublic);

    // MUTUAL follows ME (and ME follows back) → public trip should appear
    expect(ids).toContain(mutualPublic);
  });

  it("includes friends-tier trips only from followers ME also follows back", async () => {
    const res = await request(app)
      .get('/api/followers-feed')
      .set('x-test-user-id', ME);
    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    // MUTUAL: ME follows back → friends trips visible
    expect(ids).toContain(mutualFriends);

    // FOLLOWER: ME does NOT follow back → friends trips NOT visible
    expect(ids).not.toContain(followerFriends);
  });

  it("excludes trips from users who don't follow ME", async () => {
    const res = await request(app)
      .get('/api/followers-feed')
      .set('x-test-user-id', ME);
    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    // FOLLOWED follows nobody back; ME follows FOLLOWED but FOLLOWED doesn't follow ME
    expect(ids).not.toContain(followedPublic);
    expect(ids).not.toContain(followedFriends);
    expect(ids).not.toContain(followedPrivate);

    // STRANGER has no relationship
    expect(ids).not.toContain(strangerPublic);
  });

  it('returns an empty array when nobody follows the viewer', async () => {
    // STRANGER has no followers in this test graph
    const res = await request(app)
      .get('/api/followers-feed')
      .set('x-test-user-id', STRANGER);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('includes owner info on each trip', async () => {
    const res = await request(app)
      .get('/api/followers-feed')
      .set('x-test-user-id', ME);
    const feedTrip = res.body.find((t: { id: number }) => t.id === followerPublic);
    expect(feedTrip).toBeDefined();
    expect(feedTrip.owner).toMatchObject({ id: FOLLOWER });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/discover  (public trips, excluding own + already-followed)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/discover', () => {
  it('returns public trips for anonymous visitors', async () => {
    const res = await request(app).get('/api/discover');
    expect(res.status).toBe(200);

    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    // All public trips visible to anonymous
    expect(ids).toContain(followedPublic);
    expect(ids).toContain(followerPublic);
    expect(ids).toContain(mutualPublic);
    expect(ids).toContain(strangerPublic);
    expect(ids).toContain(myOwnPublic);
  });

  it('never returns friends or private trips to anonymous visitors', async () => {
    const res = await request(app).get('/api/discover');
    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    expect(ids).not.toContain(followedFriends);
    expect(ids).not.toContain(followedPrivate);
    expect(ids).not.toContain(followerFriends);
    expect(ids).not.toContain(mutualFriends);
  });

  it("excludes signed-in user's own trips", async () => {
    const res = await request(app)
      .get('/api/discover')
      .set('x-test-user-id', ME);
    expect(res.status).toBe(200);

    const ids: number[] = res.body.map((t: { id: number }) => t.id);
    expect(ids).not.toContain(myOwnPublic);
  });

  it('excludes trips from users the signed-in user already follows', async () => {
    const res = await request(app)
      .get('/api/discover')
      .set('x-test-user-id', ME);
    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    // ME follows FOLLOWED and MUTUAL → their trips excluded from discover
    expect(ids).not.toContain(followedPublic);
    expect(ids).not.toContain(mutualPublic);
  });

  it('includes public trips from users who merely follow ME (not followed back)', async () => {
    const res = await request(app)
      .get('/api/discover')
      .set('x-test-user-id', ME);
    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    // FOLLOWER follows ME but ME doesn't follow FOLLOWER → should appear in discover
    expect(ids).toContain(followerPublic);
  });

  it('includes public trips from strangers with no relationship', async () => {
    const res = await request(app)
      .get('/api/discover')
      .set('x-test-user-id', ME);
    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    expect(ids).toContain(strangerPublic);
  });

  it('never returns friends or private trips to signed-in users', async () => {
    const res = await request(app)
      .get('/api/discover')
      .set('x-test-user-id', ME);
    const ids: number[] = res.body.map((t: { id: number }) => t.id);

    expect(ids).not.toContain(followedFriends);
    expect(ids).not.toContain(followedPrivate);
    expect(ids).not.toContain(followerFriends);
    expect(ids).not.toContain(mutualFriends);
  });

  it('includes owner info on each trip', async () => {
    const res = await request(app).get('/api/discover');
    const found = res.body.find((t: { id: number }) => t.id === strangerPublic);
    expect(found).toBeDefined();
    expect(found.owner).toMatchObject({ id: STRANGER });
  });
});
