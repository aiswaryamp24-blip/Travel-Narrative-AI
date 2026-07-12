import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// How often a user's wrapped digest is automatically generated, in months.
// Kept as a fixed set of options rather than a free-form integer so the
// scheduler and UI stay in agreement about what's supported.
export const digestCadenceMonthsValues = [3, 4, 6] as const;
export type DigestCadenceMonthsValue = (typeof digestCadenceMonthsValues)[number];

// Keyed directly by the Clerk user id (e.g. "user_...") rather than a serial
// id, since every reference to a user throughout the app originates from a
// verified Clerk session.
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  digestCadenceMonths: integer("digest_cadence_months").notNull().default(4),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  digestCadenceMonths: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
