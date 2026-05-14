import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { eras } from "./eras";

export const badgeCategoryEnum = pgEnum("badge_category", [
  "volume",
  "catalog",
  "temporal",
  "era",
  "monthly_top",
  "custom",
]);

export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  imageUrl: text("image_url"),
  category: badgeCategoryEnum("category").notNull(),
  criteriaType: text("criteria_type").notNull().default("manual"), // 'automatic' | 'manual'
  criteriaConfig: jsonb("criteria_config"),
  isSecret: boolean("is_secret").default(false).notNull(),
  isIrrecoverable: boolean("is_irrecoverable").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  eraId: uuid("era_id").references(() => eras.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  badgeId: uuid("badge_id").references(() => badges.id, { onDelete: "cascade" }).notNull(),
  grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
  grantedReason: text("granted_reason"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
