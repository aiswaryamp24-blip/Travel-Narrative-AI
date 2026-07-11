import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Ensures a local `users` row exists for the given Clerk user id, creating
 * one just-in-time from Clerk's profile data on first sight. Cheap to call
 * repeatedly — it's a no-op once the row exists.
 */
async function ensureLocalUser(clerkUserId: string): Promise<void> {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, clerkUserId));
  if (existing) return;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    "Traveler";

  await db
    .insert(usersTable)
    .values({
      id: clerkUserId,
      displayName,
      avatarUrl: clerkUser.imageUrl ?? null,
    })
    .onConflictDoNothing();
}

/** Rejects unauthenticated requests; attaches `req.userId` and provisions the local user row. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await ensureLocalUser(userId);
  } catch (error) {
    req.log.error({ err: error, userId }, "Failed to provision local user");
    res.status(500).json({ error: "Failed to load account" });
    return;
  }

  req.userId = userId;
  next();
}

/** Attaches `req.userId` when a session is present, but does not reject anonymous requests. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (userId) {
    try {
      await ensureLocalUser(userId);
      req.userId = userId;
    } catch (error) {
      req.log.error({ err: error, userId }, "Failed to provision local user");
    }
  }
  next();
}
