import { vi, describe, it, expect, beforeAll } from 'vitest';
import { DIGEST_STYLE_IDS, type DigestStyleId } from './digestStyles';
import type { User, Trip, TripDay, Photo } from '@workspace/db';

// ObjectStorageService is constructed inside generateDigestPdf but only
// actually used when bundles contain trips with cover images. We mock it so
// the test doesn't need a live object-storage sidecar.
vi.mock('./objectStorage', () => ({
  ObjectStorageService: vi.fn().mockImplementation(() => ({
    getObjectEntityFile: vi.fn().mockRejectedValue(new Error('no storage in test')),
    uploadBufferAsObject: vi.fn(),
  })),
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
}));

// Minimal User fixture (all nullable fields omitted / set to sensible defaults).
const testUser: User = {
  id: 'user_test_digest_export',
  displayName: 'Test Correspondent',
  avatarUrl: null,
  digestCadenceMonths: 4,
  preferredDigestStyle: 'canon-camera',
  digestEmailEnabled: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
};

const periodStart = new Date('2025-01-01T00:00:00Z');
const periodEnd = new Date('2025-12-31T23:59:59Z');

// Empty bundle list — no object-storage calls are made, and the PDF still
// renders a cover, stats page, and BBC briefing page with zero-trip data.
const emptyBundles: Array<{ trip: Trip; days: TripDay[]; photos: Photo[] }> = [];

describe('generateDigestPdf', () => {
  // Defer the import so the vi.mock above is applied first.
  let generateDigestPdf: (
    user: User,
    periodStart: Date,
    periodEnd: Date,
    bundles: typeof emptyBundles,
    styleId?: DigestStyleId,
  ) => Promise<Buffer>;

  beforeAll(async () => {
    ({ generateDigestPdf } = await import('./digestExport'));
  });

  describe('renders a non-empty PDF buffer for every style ID', () => {
    for (const styleId of DIGEST_STYLE_IDS) {
      it(`style: ${styleId}`, async () => {
        const buffer = await generateDigestPdf(
          testUser,
          periodStart,
          periodEnd,
          emptyBundles,
          styleId,
        );

        expect(buffer).toBeInstanceOf(Buffer);
        // A real PDF starts with the %PDF magic bytes and is never trivially empty.
        expect(buffer.length).toBeGreaterThan(100);
        expect(buffer.slice(0, 4).toString()).toBe('%PDF');
      });
    }
  });

  it('throws a descriptive error for an unknown style ID', async () => {
    await expect(
      generateDigestPdf(
        testUser,
        periodStart,
        periodEnd,
        emptyBundles,
        'does-not-exist' as DigestStyleId,
      ),
    ).rejects.toThrow(/Unknown digest style ID: "does-not-exist"/);
  });
});
