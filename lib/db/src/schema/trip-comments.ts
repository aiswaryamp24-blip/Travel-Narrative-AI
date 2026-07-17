import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tripsTable } from "./trips";
import { usersTable } from "./users";

export const tripCommentsTable = pgTable("trip_comments", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id")
    .notNull()
    .references(() => tripsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTripCommentSchema = createInsertSchema(tripCommentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTripComment = z.infer<typeof insertTripCommentSchema>;
export type TripComment = typeof tripCommentsTable.$inferSelect;
