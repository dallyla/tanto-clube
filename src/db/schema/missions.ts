import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { eras } from "./eras";

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const missions = pgTable("missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  eraId: uuid("era_id").references(() => eras.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").default("📋").notNull(),
  pointsReward: integer("points_reward").notNull(),
  requiresScreenshot: boolean("requires_screenshot").default(true).notNull(),
  maxCompletionsPerUser: integer("max_completions_per_user").default(1).notNull(),
  maxTotalCompletions: integer("max_total_completions"),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const missionSubmissions = pgTable("mission_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  missionId: uuid("mission_id").references(() => missions.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  screenshotUrl: text("screenshot_url"),
  notes: text("notes"),
  status: submissionStatusEnum("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  pointsTransactionId: uuid("points_transaction_id"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;
export type MissionSubmission = typeof missionSubmissions.$inferSelect;
export type NewMissionSubmission = typeof missionSubmissions.$inferInsert;
