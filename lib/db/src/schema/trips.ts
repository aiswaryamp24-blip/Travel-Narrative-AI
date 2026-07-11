import {
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tripStatusValues = [
  "pending",
  "processing",
  "ready",
  "error",
] as const;
export type TripStatusValue = (typeof tripStatusValues)[number];

export const tripPrivacyValues = ["private", "friends", "public"] as const;
export type TripPrivacyValue = (typeof tripPrivacyValues)[number];

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status", { enum: tripStatusValues }).notNull().default("pending"),
  coverObjectPath: text("cover_object_path"),
  summary: text("summary"),
  errorMessage: text("error_message"),
  // Nullable so pre-existing trips created before accounts existed don't
  // break — they simply have no owner and stay hidden from every listing
  // until the app associates them with a real signed-in user.
  userId: text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  privacy: text("privacy", { enum: tripPrivacyValues }).notNull().default("private"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({
  id: true,
  status: true,
  coverObjectPath: true,
  summary: true,
  errorMessage: true,
  userId: true,
  privacy: true,
  createdAt: true,
});
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;

export const photosTable = pgTable("photos", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id")
    .notNull()
    .references(() => tripsTable.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull(),
  filename: text("filename").notNull(),
  lat: doublePrecision("lat"),
  lon: doublePrecision("lon"),
  takenAt: timestamp("taken_at", { withTimezone: true }),
  tripDayId: integer("trip_day_id"),
});

export const insertPhotoSchema = createInsertSchema(photosTable).omit({
  id: true,
  tripDayId: true,
});
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photosTable.$inferSelect;

export const tripDaysTable = pgTable("trip_days", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id")
    .notNull()
    .references(() => tripsTable.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  locationName: text("location_name"),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  elevationMeters: doublePrecision("elevation_meters"),
  distanceKm: doublePrecision("distance_km"),
  weather: jsonb("weather").$type<{
    tempMaxC: number | null;
    tempMinC: number | null;
    precipitationMm: number | null;
    windSpeedMaxKmh: number | null;
    weatherCode: number | null;
    conditions: string | null;
  } | null>(),
  landmarks: jsonb("landmarks")
    .$type<
      Array<{
        name: string;
        kind: string;
        distanceMeters: number | null;
        lat: number;
        lon: number;
      }>
    >()
    .notNull()
    .default([]),
  headline: text("headline"),
  narrative: text("narrative"),
  heroPhotoId: integer("hero_photo_id"),
  audioObjectPath: text("audio_object_path"),
});

export const insertTripDaySchema = createInsertSchema(tripDaysTable).omit({
  id: true,
});
export type InsertTripDay = z.infer<typeof insertTripDaySchema>;
export type TripDay = typeof tripDaysTable.$inferSelect;
