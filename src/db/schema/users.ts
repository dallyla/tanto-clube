import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["fan", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  avatarEmoji: text("avatar_emoji").default("🎵"),

  lastfmUsername: text("lastfm_username").unique(),
  lastfmRegisteredAt: timestamp("lastfm_registered_at", { withTimezone: true }),
  lastfmConnectedAt: timestamp("lastfm_connected_at", { withTimezone: true }),

  isOnboarded: boolean("is_onboarded").default(false).notNull(),
  role: userRoleEnum("role").default("fan").notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  banReason: text("ban_reason"),

  // Denormalized for fast reads
  totalPoints: integer("total_points").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastListenedAt: timestamp("last_listened_at", { withTimezone: true }),

  // Polling config
  nextPollAt: timestamp("next_poll_at", { withTimezone: true }),
  lastPollAt: timestamp("last_poll_at", { withTimezone: true }),
  pollIntervalHours: integer("poll_interval_hours").default(2).notNull(),

  // Admin moderation
  suspicionDismissedAt: timestamp("suspicion_dismissed_at", { withTimezone: true }),

  // Settings
  anonymousMode: boolean("anonymous_mode").default(false).notNull(),
  themePreference: text("theme_preference").default("dark"),
  pushEnabled: boolean("push_enabled").default(false).notNull(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
