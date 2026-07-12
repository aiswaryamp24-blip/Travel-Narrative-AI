import { db, followsTable, photosTable, tripDaysTable, tripsTable, type Trip } from '@workspace/db';
import { and, eq, or } from 'drizzle-orm';

/**
 * A viewer can see a trip when: it's public, they own it, or it's
 * friends-tier and they follow the owner. Following is one-directional, so
 * only the follower's own follow row matters — the owner does not need to
 * follow back.
 */
export async function canViewTrip(trip: Trip, viewerUserId: string | undefined): Promise<boolean> {
  if (trip.privacy === 'public') return true;
  if (!!viewerUserId && viewerUserId === trip.userId) return true;

  if (trip.privacy === 'friends' && viewerUserId && trip.userId) {
    const [follow] = await db
      .select({ followerId: followsTable.followerId })
      .from(followsTable)
      .where(
        and(
          eq(followsTable.followerId, viewerUserId),
          eq(followsTable.followedId, trip.userId),
        ),
      );
    return !!follow;
  }

  return false;
}

/**
 * Resolves the trip that owns a given object storage path, checking trip
 * covers, day photos, and day narration audio. Used to enforce the same
 * privacy rules on raw media fetches (`/storage/objects/*`) as on the trip
 * API itself — otherwise a private trip's photos/audio would remain fetchable
 * by anyone who has seen the object path.
 */
export async function findTripForObjectPath(objectPath: string): Promise<Trip | null> {
  const [byCover] = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.coverObjectPath, objectPath));
  if (byCover) return byCover;

  const [byPhoto] = await db
    .select({ trip: tripsTable })
    .from(photosTable)
    .innerJoin(tripsTable, eq(photosTable.tripId, tripsTable.id))
    .where(eq(photosTable.objectPath, objectPath));
  if (byPhoto) return byPhoto.trip;

  const [byAudio] = await db
    .select({ trip: tripsTable })
    .from(tripDaysTable)
    .innerJoin(tripsTable, eq(tripDaysTable.tripId, tripsTable.id))
    .where(eq(tripDaysTable.audioObjectPath, objectPath));
  if (byAudio) return byAudio.trip;

  return null;
}
