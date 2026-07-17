import { clerkClient } from '@clerk/express';
import { and, desc, eq, gt, lte } from 'drizzle-orm';
import {
  db,
  digestsTable,
  photosTable,
  tripDaysTable,
  tripsTable,
  usersTable,
  DEFAULT_DIGEST_STYLE_VALUE,
  digestStyleValues,
  type DigestStyleValue,
} from '@workspace/db';
import { generateDigestPdf, type DigestTripBundle } from './digestExport';
import type { DigestStyleId } from './digestStyles';
import { ObjectNotFoundError, ObjectStorageService } from './objectStorage';
import { sendDigestReadyEmail } from './email';
import { logger } from './logger';

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
  { force = false, styleId }: { force?: boolean; styleId?: DigestStyleId } = {},
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
    const dueAt = addMonths(periodStart, user.digestCadenceMonths);
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

  // Determine which style to use: explicit override > user's saved preference > default
  const resolvedStyleId: DigestStyleId =
    styleId ??
    (digestStyleValues.includes(user.preferredDigestStyle as DigestStyleValue)
      ? (user.preferredDigestStyle as DigestStyleId)
      : DEFAULT_DIGEST_STYLE_VALUE);

  // Persist the chosen style as the user's new preference (so the next
  // scheduled digest will reuse it automatically).
  if (styleId && styleId !== user.preferredDigestStyle) {
    await db
      .update(usersTable)
      .set({ preferredDigestStyle: styleId })
      .where(eq(usersTable.id, userId));
  }

  const pdfBuffer = await generateDigestPdf(user, periodStart, periodEnd, bundles, resolvedStyleId);

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
      style: resolvedStyleId,
    })
    .returning();

  return { status: 'created', digest };
}

/**
 * Re-renders an existing digest PDF in a different style.
 *
 * Uploads the new PDF to object storage, deletes the old file, then updates
 * the digest row in-place (same id, same period — no duplicate is created).
 */
export async function restyleExistingDigest(
  digest: typeof digestsTable.$inferSelect,
  newStyleId: DigestStyleId,
): Promise<typeof digestsTable.$inferSelect> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, digest.userId));
  if (!user) {
    throw new Error(`User ${digest.userId} not found`);
  }

  // Fetch the same trips that were originally covered by this digest.
  const trips = await db
    .select()
    .from(tripsTable)
    .where(
      and(
        eq(tripsTable.userId, digest.userId),
        eq(tripsTable.status, 'ready'),
        gt(tripsTable.createdAt, digest.periodStart),
        lte(tripsTable.createdAt, digest.periodEnd),
      ),
    )
    .orderBy(tripsTable.createdAt);

  const bundles: DigestTripBundle[] = await Promise.all(
    trips.map(async (trip) => {
      const [days, photos] = await Promise.all([
        db.select().from(tripDaysTable).where(eq(tripDaysTable.tripId, trip.id)),
        db.select().from(photosTable).where(eq(photosTable.tripId, trip.id)),
      ]);
      return { trip, days, photos };
    }),
  );

  const pdfBuffer = await generateDigestPdf(
    user,
    digest.periodStart,
    digest.periodEnd,
    bundles,
    newStyleId,
  );

  const objectStorageService = new ObjectStorageService();
  const oldObjectPath = digest.objectPath;

  // 1. Upload the new PDF first (non-destructive — old file still intact).
  const newObjectPath = await objectStorageService.uploadBufferAsObject(pdfBuffer, 'application/pdf');

  let updated: typeof digestsTable.$inferSelect;
  try {
    // 2. Commit: point the DB row at the new file.
    const [row] = await db
      .update(digestsTable)
      .set({ objectPath: newObjectPath, style: newStyleId })
      .where(eq(digestsTable.id, digest.id))
      .returning();
    updated = row;
  } catch (dbError) {
    // DB update failed — roll back by deleting the freshly uploaded file so
    // we don't leave an orphaned blob, then re-throw so the caller returns 500.
    try {
      const newFile = await objectStorageService.getObjectEntityFile(newObjectPath);
      await newFile.delete();
    } catch (cleanupError) {
      logger.warn({ err: cleanupError, digestId: digest.id }, 'Could not clean up orphaned digest PDF after DB failure');
    }
    throw dbError;
  }

  // 3. Best-effort cleanup of the old file — only after the DB row is safely updated.
  try {
    const oldFile = await objectStorageService.getObjectEntityFile(oldObjectPath);
    await oldFile.delete();
  } catch (error) {
    if (!(error instanceof ObjectNotFoundError)) {
      logger.warn({ err: error, digestId: digest.id }, 'Could not delete old digest file during restyle');
    }
  }

  return updated;
}

/** Evaluates every user and generates a digest for anyone who is due. Never throws. */
export async function checkAndGenerateDueDigests(): Promise<void> {
  const users = await db
    .select({ id: usersTable.id, displayName: usersTable.displayName, digestEmailEnabled: usersTable.digestEmailEnabled })
    .from(usersTable);

  for (const { id: userId, displayName, digestEmailEnabled } of users) {
    try {
      const result = await getOrCreateDigestForUser(userId, { force: false });
      if (result.status === 'created') {
        logger.info({ userId, digestId: result.digest.id }, 'Generated periodic trip digest');
        if (digestEmailEnabled) {
          await notifyDigestReady(userId, displayName, result.digest);
        } else {
          logger.info({ userId, digestId: result.digest.id }, 'Skipping digest-ready email — user opted out');
        }
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
