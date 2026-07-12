import { clerkClient } from '@clerk/express';
import { and, desc, eq, gt, lte } from 'drizzle-orm';
import {
  db,
  digestsTable,
  photosTable,
  tripDaysTable,
  tripsTable,
  usersTable,
} from '@workspace/db';
import { generateDigestPdf, type DigestTripBundle } from './digestExport';
import { ObjectStorageService } from './objectStorage';
import { sendDigestReadyEmail } from './email';
import { logger } from './logger';

/** Cadence for automatic digest generation, per product decision (every 3-6 months). */
export const DIGEST_CADENCE_MONTHS = 4;

/** How often the background scheduler re-evaluates every user. */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export type DigestResult =
  | { status: 'created'; digest: typeof digestsTable.$inferSelect }
  | { status: 'no_trips' }
  | { status: 'not_due'; dueAt: Date };

/**
 * Computes the period covered by a user's next digest — from the end of
 * their last digest (or account creation, for their first one) through now
 * — and, if there is anything to cover, renders and stores a new digest PDF.
 *
 * `force: true` (manual "generate now") skips the cadence check but still
 * refuses to create an empty digest when there are no completed trips in
 * the period.
 */
export async function getOrCreateDigestForUser(
  userId: string,
  { force = false }: { force?: boolean } = {},
): Promise<DigestResult> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const [lastDigest] = await db
    .select()
    .from(digestsTable)
    .where(eq(digestsTable.userId, userId))
    .orderBy(desc(digestsTable.periodEnd))
    .limit(1);

  const periodStart = lastDigest?.periodEnd ?? user.createdAt;
  const periodEnd = new Date();

  if (!force) {
    const dueAt = addMonths(periodStart, DIGEST_CADENCE_MONTHS);
    if (periodEnd < dueAt) {
      return { status: 'not_due', dueAt };
    }
  }

  const trips = await db
    .select()
    .from(tripsTable)
    .where(
      and(
        eq(tripsTable.userId, userId),
        eq(tripsTable.status, 'ready'),
        gt(tripsTable.createdAt, periodStart),
        lte(tripsTable.createdAt, periodEnd),
      ),
    )
    .orderBy(tripsTable.createdAt);

  if (trips.length === 0) {
    return { status: 'no_trips' };
  }

  const bundles: DigestTripBundle[] = await Promise.all(
    trips.map(async (trip) => {
      const [days, photos] = await Promise.all([
        db.select().from(tripDaysTable).where(eq(tripDaysTable.tripId, trip.id)),
        db.select().from(photosTable).where(eq(photosTable.tripId, trip.id)),
      ]);
      return { trip, days, photos };
    }),
  );

  const pdfBuffer = await generateDigestPdf(user, periodStart, periodEnd, bundles);

  const objectStorageService = new ObjectStorageService();
  const objectPath = await objectStorageService.uploadBufferAsObject(
    pdfBuffer,
    'application/pdf',
  );

  const [digest] = await db
    .insert(digestsTable)
    .values({
      userId,
      periodStart,
      periodEnd,
      objectPath,
      tripCount: trips.length,
    })
    .returning();

  return { status: 'created', digest };
}

/** Evaluates every user and generates a digest for anyone who is due. Never throws. */
export async function checkAndGenerateDueDigests(): Promise<void> {
  const users = await db.select({ id: usersTable.id, displayName: usersTable.displayName }).from(usersTable);

  for (const { id: userId, displayName } of users) {
    try {
      const result = await getOrCreateDigestForUser(userId, { force: false });
      if (result.status === 'created') {
        logger.info({ userId, digestId: result.digest.id }, 'Generated periodic trip digest');
        await notifyDigestReady(userId, displayName, result.digest);
      }
    } catch (error) {
      logger.error({ err: error, userId }, 'Failed to evaluate/generate digest for user');
    }
  }
}

/** Looks up the user's verified email via Clerk and, if found, emails them that their digest is ready. */
async function notifyDigestReady(
  userId: string,
  displayName: string,
  digest: typeof digestsTable.$inferSelect,
): Promise<void> {
  let email: string | null = null;
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    email =
      clerkUser.emailAddresses.find(
        (address) =>
          address.id === clerkUser.primaryEmailAddressId && address.verification?.status === 'verified',
      )?.emailAddress ?? null;
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to look up Clerk user for digest-ready email');
    return;
  }

  await sendDigestReadyEmail({
    userId,
    email,
    displayName,
    digestId: digest.id,
    tripCount: digest.tripCount,
  });
}

/** Starts the periodic background check. Runs once immediately, then on an interval. */
export function startDigestScheduler(): void {
  checkAndGenerateDueDigests().catch((error) => {
    logger.error({ err: error }, 'Initial digest scheduler run failed');
  });

  setInterval(() => {
    checkAndGenerateDueDigests().catch((error) => {
      logger.error({ err: error }, 'Digest scheduler run failed');
    });
  }, CHECK_INTERVAL_MS);
}
