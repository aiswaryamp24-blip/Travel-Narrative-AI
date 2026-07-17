import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable, DEFAULT_DIGEST_STYLE_VALUE } from "./users";

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
  // The visual style used to render this digest's PDF (stored so the restyle
  // picker can pre-fill the current choice and the card can display a label).
  style: text("style").notNull().default(DEFAULT_DIGEST_STYLE_VALUE),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDigestSchema = createInsertSchema(digestsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDigest = z.infer<typeof insertDigestSchema>;
export type Digest = typeof digestsTable.$inferSelect;
