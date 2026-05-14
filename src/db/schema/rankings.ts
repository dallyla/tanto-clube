import { integer, jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { eras } from "./eras";

export const rankingTypeEnum = pgEnum("ranking_type", [
  "era",
  "monthly",
  "all_time",
  "album_operation",
]);

export const rankingsSnapshots = pgTable("rankings_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  eraId: uuid("era_id").references(() => eras.id, { onDelete: "cascade" }),
  rankingType: rankingTypeEnum("ranking_type").notNull(),
  weekNumber: integer("week_number"),
  month: integer("month"), // YYYYMM
  // Top 100 stored as JSONB: [{rank, userId, displayName, points, badgeCount}]
  data: jsonb("data").notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const streaks = pgTable("streaks", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  // DATE stored as text YYYY-MM-DD for simplicity across timezones
  lastActiveDate: integer("last_active_date"), // stored as YYYYMMDD integer
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type RankingSnapshot = typeof rankingsSnapshots.$inferSelect;
export type Streak = typeof streaks.$inferSelect;
