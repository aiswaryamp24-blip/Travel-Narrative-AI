import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// A generated "wrapped"-style recap PDF covering a user's completed trips
// within [periodStart, periodEnd). Digests are personal keepsakes — always
// private to their owner regardless of the underlying trips' privacy tier.
export const digestsTable = pgTable("digests", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  objectPath: text("object_path").notNull(),
  tripCount: integer("trip_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDigestSchema = createInsertSchema(digestsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDigest = z.infer<typeof insertDigestSchema>;
export type Digest = typeof digestsTable.$inferSelect;
