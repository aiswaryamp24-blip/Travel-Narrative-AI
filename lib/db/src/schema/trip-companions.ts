import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { tripsTable } from "./trips";
import { usersTable } from "./users";

// Companion tags require the tagged user's confirmation before showing
// anywhere (unlike Follow, which is unilateral) — so a tag doesn't surprise
// someone by appearing on their profile without their say-so.
export const tripCompanionStatusValues = ["pending", "confirmed"] as const;
export type TripCompanionStatusValue = (typeof tripCompanionStatusValues)[number];

export const tripCompanionsTable = pgTable(
  "trip_companions",
  {
    tripId: integer("trip_id")
      .notNull()
      .references(() => tripsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    status: text("status", { enum: tripCompanionStatusValues }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.tripId, table.userId)],
);

export type TripCompanion = typeof tripCompanionsTable.$inferSelect;
