import { db, photosTable, tripDaysTable, tripsTable, type Trip } from '@workspace/db';
import { eq, or } from 'drizzle-orm';

/**
 * Friends-tier visibility (owner + followers) lands with the friends-feed
 * task, which introduces the `follows` table. Until then, friends-tier
 * trips are only visible to their owner, same as private ones.
 */
export function canViewTrip(trip: Trip, viewerUserId: string | undefined): boolean {
  if (trip.privacy === 'public') return true;
  return !!viewerUserId && viewerUserId === trip.userId;
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
