import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { eras } from "./eras";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "scrobble",
  "mission",
  "bonus",
  "streak_bonus",
  "admin_correction",
  "penalty",
]);

export const pointsTransactions = pgTable("points_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(),
  type: transactionTypeEnum("type").notNull(),

  // Source reference (scrobble_id, mission_submission_id, etc.)
  sourceId: uuid("source_id"),
  sourceType: text("source_type"),

  description: text("description").notNull(),
  eraId: uuid("era_id").references(() => eras.id, { onDelete: "set null" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type NewPointsTransaction = typeof pointsTransactions.$inferInsert;
