import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const eraStatusEnum = pgEnum("era_status", ["draft", "scheduled", "active", "ended"]);

export const eras = pgTable("eras", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  emoji: text("emoji").notNull(),
  tagline: text("tagline"),

  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: eraStatusEnum("status").default("draft").notNull(),

  // Last.fm matching
  focusAlbum: text("focus_album"),
  focusTracks: text("focus_tracks").array().default([]),
  artistName: text("artist_name").default("Diego Martins").notNull(),

  // Multipliers
  baseMultiplier: numeric("base_multiplier", { precision: 4, scale: 2 }).default("1.00").notNull(),
  focusAlbumMultiplier: numeric("focus_album_multiplier", { precision: 4, scale: 2 }).default("2.00").notNull(),
  focusTrackMultiplier: numeric("focus_track_multiplier", { precision: 4, scale: 2 }).default("3.00").notNull(),
  launchWindowMultiplier: numeric("launch_window_multiplier", { precision: 4, scale: 2 }).default("1.00").notNull(),
  launchWindowEndsAt: timestamp("launch_window_ends_at", { withTimezone: true }),

  // Anti-fraud caps (override defaults)
  maxDailyFocusScrobbles: integer("max_daily_focus_scrobbles").default(150).notNull(),
  maxDailyTotalScrobbles: integer("max_daily_total_scrobbles").default(200).notNull(),
  maxHourlyScrobbles: integer("max_hourly_scrobbles").default(25).notNull(),

  announcedAt: timestamp("announced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Era = typeof eras.$inferSelect;
export type NewEra = typeof eras.$inferInsert;
