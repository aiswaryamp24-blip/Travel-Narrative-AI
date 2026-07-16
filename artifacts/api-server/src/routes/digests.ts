import { Readable } from 'stream';
import { db, digestsTable, digestStyleValues, type Digest } from '@workspace/db';
import { desc, eq } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response } from 'express';
import { requireAuth } from '../middlewares/auth';
import { getOrCreateDigestForUser } from '../lib/digestScheduler';
import type { DigestStyleId } from '../lib/digestStyles';
import { ObjectNotFoundError, ObjectStorageService } from '../lib/objectStorage';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function toDigestSummary(digest: Digest) {
  return {
    id: digest.id,
    periodStart: digest.periodStart.toISOString(),
    periodEnd: digest.periodEnd.toISOString(),
    tripCount: digest.tripCount,
    createdAt: digest.createdAt.toISOString(),
  };
}

/** GET /digests — the signed-in user's own digests, newest first. */
router.get('/digests', requireAuth, async (req: Request, res: Response) => {
  const digests = await db
    .select()
    .from(digestsTable)
    .where(eq(digestsTable.userId, req.userId!))
    .orderBy(desc(digestsTable.periodEnd));

  res.json(digests.map(toDigestSummary));
});

/** POST /digests/generate — manually trigger a digest now, bypassing the cadence check. */
router.post('/digests/generate', requireAuth, async (req: Request, res: Response) => {
  // Optional style override — validated against the known set.
  const rawStyle = req.body?.style as string | undefined;
  const styleId: DigestStyleId | undefined =
    rawStyle && digestStyleValues.includes(rawStyle as any)
      ? (rawStyle as DigestStyleId)
      : undefined;

  try {
    const result = await getOrCreateDigestForUser(req.userId!, { force: true, styleId });
    if (result.status !== 'created') {
      res.status(400).json({
        error: 'No completed trips since your last digest — nothing to generate yet.',
      });
      return;
    }
    res.status(201).json(toDigestSummary(result.digest));
  } catch (error) {
    req.log.error({ err: error, userId: req.userId }, 'Error generating digest');
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

/** GET /digests/:digestId/download — stream a digest PDF (owner only). */
router.get(
  '/digests/:digestId/download',
  requireAuth,
  async (req: Request, res: Response) => {
    const digestId = Number(req.params.digestId);
    if (!Number.isInteger(digestId)) {
      res.status(404).json({ error: 'Digest not found' });
      return;
    }

    const [digest] = await db
      .select()
      .from(digestsTable)
      .where(eq(digestsTable.id, digestId));

    if (!digest || digest.userId !== req.userId) {
      res.status(404).json({ error: 'Digest not found' });
      return;
    }

    try {
      const file = await objectStorageService.getObjectEntityFile(digest.objectPath);
      const response = await objectStorageService.downloadObject(file);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="trip-correspondent-wrapped-${digest.id}.pdf"`,
      );
      if (response.body) {
        Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: 'Digest file not found' });
        return;
      }
      req.log.error({ err: error, digestId }, 'Error serving digest download');
      res.status(500).json({ error: 'Failed to serve digest' });
    }
  },
);

/** DELETE /digests/:digestId — delete a digest and its stored PDF (owner only). */
router.delete(
  '/digests/:digestId',
  requireAuth,
  async (req: Request, res: Response) => {
    const digestId = Number(req.params.digestId);
    if (!Number.isInteger(digestId)) {
      res.status(404).json({ error: 'Digest not found' });
      return;
    }

    const [digest] = await db
      .select()
      .from(digestsTable)
      .where(eq(digestsTable.id, digestId));

    if (!digest || digest.userId !== req.userId) {
      res.status(404).json({ error: 'Digest not found' });
      return;
    }

    try {
      const file = await objectStorageService.getObjectEntityFile(digest.objectPath);
      await file.delete();
    } catch (error) {
      if (!(error instanceof ObjectNotFoundError)) {
        req.log.error({ err: error, digestId }, 'Error deleting digest file');
        res.status(500).json({ error: 'Failed to delete digest' });
        return;
      }
      // File already gone — still proceed to remove the DB row.
    }

    await db.delete(digestsTable).where(eq(digestsTable.id, digestId));

    res.status(204).end();
  },
);

export default router;
