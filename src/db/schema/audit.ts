import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  ipAddress: text("ip_address"), // stored as text; inet type not needed for MVP
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lastfmPollLog = pgTable("lastfm_poll_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  polledAt: timestamp("polled_at", { withTimezone: true }).defaultNow().notNull(),
  scrobblesFetched: integer("scrobbles_fetched").default(0).notNull(),
  scrobblesNew: integer("scrobbles_new").default(0).notNull(),
  apiCallsMade: integer("api_calls_made").default(1).notNull(),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type LastfmPollLog = typeof lastfmPollLog.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
