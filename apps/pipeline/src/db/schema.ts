import { sqliteTable, integer, real } from "drizzle-orm/sqlite-core";

export const geolocationFixes = sqliteTable("geolocation_fixes", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"),
  altitude: real("altitude"),
  altitudeAccuracy: real("altitude_accuracy"),
  speed: real("speed"),
  heading: real("heading"),

  timestamp: integer("timestamp").notNull(),
  capturedAt: integer("captured_at").notNull(),
  forwardedAt: integer("forwarded_at"),
  retryCount: integer("retry_count").default(0).notNull(),
});
