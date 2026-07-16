import { db, digestsTable, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app';
import { ObjectNotFoundError, ObjectStorageService } from '../lib/objectStorage';

const objectStorageService = new ObjectStorageService();

const OWNER_ID = 'user_test_digest_owner';
const OTHER_ID = 'user_test_digest_other';

async function fileExists(objectPath: string): Promise<boolean> {
  try {
    await objectStorageService.getObjectEntityFile(objectPath);
    return true;
  } catch (error) {
    if (error instanceof ObjectNotFoundError) return false;
    throw error;
  }
}

/** Uploads a throwaway PDF-ish buffer and inserts a digest row pointing at it. */
async function createDigestWithFile(userId: string) {
  const objectPath = await objectStorageService.uploadBufferAsObject(
    Buffer.from('%PDF-1.4 test digest content'),
    'application/pdf',
  );
  const [digest] = await db
    .insert(digestsTable)
    .values({
      userId,
      periodStart: new Date('2026-01-01T00:00:00Z'),
      periodEnd: new Date('2026-04-01T00:00:00Z'),
      objectPath,
      tripCount: 3,
    })
    .returning();
  return digest;
}

describe('DELETE /api/digests/:digestId', () => {
  beforeAll(async () => {
    await db
      .insert(usersTable)
      .values([
        { id: OWNER_ID, displayName: 'Digest Owner' },
        { id: OTHER_ID, displayName: 'Someone Else' },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    // Cascades to any leftover digest rows created above.
    await db.delete(usersTable).where(eq(usersTable.id, OWNER_ID));
    await db.delete(usersTable).where(eq(usersTable.id, OTHER_ID));
  });

  it('removes both the DB row and the stored PDF for the owner', async () => {
    const digest = await createDigestWithFile(OWNER_ID);
    await expect(fileExists(digest.objectPath)).resolves.toBe(true);

    const res = await request(app)
      .delete(`/api/digests/${digest.id}`)
      .set('x-test-user-id', OWNER_ID);

    expect(res.status).toBe(204);

    const [row] = await db.select().from(digestsTable).where(eq(digestsTable.id, digest.id));
    expect(row).toBeUndefined();
    await expect(fileExists(digest.objectPath)).resolves.toBe(false);
  });

  it("returns 404 and leaves the digest and file intact when a different user tries to delete it", async () => {
    const digest = await createDigestWithFile(OWNER_ID);

    const res = await request(app)
      .delete(`/api/digests/${digest.id}`)
      .set('x-test-user-id', OTHER_ID);

    expect(res.status).toBe(404);

    const [row] = await db.select().from(digestsTable).where(eq(digestsTable.id, digest.id));
    expect(row).toBeDefined();
    await expect(fileExists(digest.objectPath)).resolves.toBe(true);

    // Cleanup since this digest survives the request under test.
    await db.delete(digestsTable).where(eq(digestsTable.id, digest.id));
    const file = await objectStorageService.getObjectEntityFile(digest.objectPath);
    await file.delete();
  });

  it('returns 404 for a nonexistent digest id', async () => {
    const res = await request(app)
      .delete('/api/digests/999999999')
      .set('x-test-user-id', OWNER_ID);

    expect(res.status).toBe(404);
  });

  it('returns 404 rather than erroring when deleting an already-deleted digest', async () => {
    const digest = await createDigestWithFile(OWNER_ID);

    const firstDelete = await request(app)
      .delete(`/api/digests/${digest.id}`)
      .set('x-test-user-id', OWNER_ID);
    expect(firstDelete.status).toBe(204);

    const secondDelete = await request(app)
      .delete(`/api/digests/${digest.id}`)
      .set('x-test-user-id', OWNER_ID);
    expect(secondDelete.status).toBe(404);
  });
});
