/**
 * Tests that checkAndGenerateDueDigests correctly honours the
 * digestEmailEnabled flag — creating the digest PDF in both cases,
 * but only calling sendDigestReadyEmail for users who have opted in.
 *
 * Heavy I/O (PDF generation, object storage, real emails) is mocked so
 * the test is fast and hermetic.
 */
import { clerkClient } from '@clerk/express';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { db, digestsTable, tripsTable, usersTable } from '@workspace/db';

// ── Mocks (hoisted by vitest before any imports execute) ─────────────────────

vi.mock('./email', () => ({
  sendDigestReadyEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./digestExport', () => ({
  generateDigestPdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock digest')),
}));

vi.mock('./objectStorage', () => {
  const ObjectNotFoundError = class ObjectNotFoundError extends Error {};
  const ObjectStorageService = vi.fn().mockImplementation(() => ({
    uploadBufferAsObject: vi.fn().mockResolvedValue('mock/scheduler-test/digest.pdf'),
    getObjectEntityFile: vi.fn().mockResolvedValue({ delete: vi.fn().mockResolvedValue(undefined) }),
  }));
  return { ObjectStorageService, ObjectNotFoundError };
});

// ── Import subjects after mocks are set up ────────────────────────────────────

import { checkAndGenerateDueDigests } from './digestScheduler';
import { sendDigestReadyEmail } from './email';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const OPT_OUT_USER = 'user_sched_test_optout';
const OPT_IN_USER = 'user_sched_test_optin';

// User was created two years ago so the digest cadence (4 months default) has
// elapsed many times — the scheduler will always consider them overdue.
const TWO_YEARS_AGO = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);

// Trip created one year ago — falls cleanly inside the uncovered period
// (periodStart = user.createdAt, periodEnd = now).
const ONE_YEAR_AGO = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('checkAndGenerateDueDigests — digestEmailEnabled flag', () => {
  let optOutTripId: number;
  let optInTripId: number;

  beforeAll(async () => {
    // Insert test users. onConflictDoNothing is defensive in case a previous
    // run was interrupted and left rows behind.
    await db
      .insert(usersTable)
      .values([
        {
          id: OPT_OUT_USER,
          displayName: 'Opt-Out User',
          digestEmailEnabled: false,
          createdAt: TWO_YEARS_AGO,
        },
        {
          id: OPT_IN_USER,
          displayName: 'Opt-In User',
          digestEmailEnabled: true,
          createdAt: TWO_YEARS_AGO,
        },
      ])
      .onConflictDoNothing();

    // Each user needs at least one completed trip inside the uncovered period
    // so getOrCreateDigestForUser returns status: 'created'.
    const inserted = await db
      .insert(tripsTable)
      .values([
        {
          title: 'Opt-Out User Trip',
          status: 'ready',
          userId: OPT_OUT_USER,
          createdAt: ONE_YEAR_AGO,
        },
        {
          title: 'Opt-In User Trip',
          status: 'ready',
          userId: OPT_IN_USER,
          createdAt: ONE_YEAR_AGO,
        },
      ])
      .returning({ id: tripsTable.id });

    optOutTripId = inserted[0].id;
    optInTripId = inserted[1].id;

    // Clerk returns a verified primary email for the opted-in user only.
    vi.mocked(clerkClient.users.getUser).mockImplementation(async (userId: string) => {
      const isOptIn = userId === OPT_IN_USER;
      return {
        primaryEmailAddressId: isOptIn ? 'ea_optin_1' : null,
        emailAddresses: isOptIn
          ? [
              {
                id: 'ea_optin_1',
                emailAddress: 'optin@example.com',
                verification: { status: 'verified' },
              },
            ]
          : [],
      } as any;
    });

    // Run the scheduler exactly once. Both test users are now overdue and have
    // ready trips, so both digests should be generated; only the opted-in user
    // should receive an email.
    await checkAndGenerateDueDigests();
  });

  afterAll(async () => {
    // Trips must be deleted before users (userId FK is set-null on delete,
    // but explicit cleanup keeps the test DB tidy).
    await db.delete(tripsTable).where(eq(tripsTable.id, optOutTripId));
    await db.delete(tripsTable).where(eq(tripsTable.id, optInTripId));

    // Cascade-delete digest rows created during the scheduler run.
    await db.delete(digestsTable).where(eq(digestsTable.userId, OPT_OUT_USER));
    await db.delete(digestsTable).where(eq(digestsTable.userId, OPT_IN_USER));

    await db.delete(usersTable).where(eq(usersTable.id, OPT_OUT_USER));
    await db.delete(usersTable).where(eq(usersTable.id, OPT_IN_USER));
  });

  it('creates a digest row for the opted-out user', async () => {
    const rows = await db
      .select()
      .from(digestsTable)
      .where(eq(digestsTable.userId, OPT_OUT_USER));
    expect(rows.length).toBeGreaterThan(0);
  });

  it('creates a digest row for the opted-in user', async () => {
    const rows = await db
      .select()
      .from(digestsTable)
      .where(eq(digestsTable.userId, OPT_IN_USER));
    expect(rows.length).toBeGreaterThan(0);
  });

  it('does NOT call sendDigestReadyEmail for a user with digestEmailEnabled: false', () => {
    const calls = vi.mocked(sendDigestReadyEmail).mock.calls;
    const calledForOptOut = calls.some(([params]) => params.userId === OPT_OUT_USER);
    expect(calledForOptOut).toBe(false);
  });

  it('DOES call sendDigestReadyEmail for a user with digestEmailEnabled: true', () => {
    const calls = vi.mocked(sendDigestReadyEmail).mock.calls;
    const calledForOptIn = calls.some(([params]) => params.userId === OPT_IN_USER);
    expect(calledForOptIn).toBe(true);
  });
});
