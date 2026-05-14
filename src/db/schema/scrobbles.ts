import { boolean, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { eras } from "./eras";

export const scrobbles = pgTable(
  "scrobbles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    eraId: uuid("era_id").references(() => eras.id, { onDelete: "set null" }),

    // Normalized key for deduplication: "artist::track::album"
    lastfmTrackKey: text("lastfm_track_key").notNull(),
    trackName: text("track_name").notNull(),
    artistName: text("artist_name").notNull(),
    albumName: text("album_name"),

    scrobbledAt: timestamp("scrobbled_at", { withTimezone: true }).notNull(),

    // Computed flags
    isFocusAlbum: boolean("is_focus_album").default(false).notNull(),
    isFocusTrack: boolean("is_focus_track").default(false).notNull(),

    // Anti-fraud
    isCounted: boolean("is_counted").default(true).notNull(),
    capReason: text("cap_reason"), // 'hourly_cap' | 'daily_focus_cap' | 'daily_total_cap'

    // Points (stored eagerly on scrobble)
    rawPoints: integer("raw_points").default(0).notNull(),
    pointsEarned: integer("points_earned").default(0).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("scrobbles_dedup_idx").on(
      table.userId,
      table.scrobbledAt,
      table.lastfmTrackKey,
    ),
  ],
);

export type Scrobble = typeof scrobbles.$inferSelect;
export type NewScrobble = typeof scrobbles.$inferInsert;
