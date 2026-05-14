import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { eras } from "./eras";

export const prizeTypeEnum = pgEnum("prize_type", ["sticker", "mug", "poster", "other", "digital"]);
export const prizeAwardStatusEnum = pgEnum("prize_award_status", [
  "pending_review",
  "approved",
  "address_pending",
  "shipped",
  "delivered",
  "cancelled",
]);

export const prizes = pgTable("prizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  prizeType: prizeTypeEnum("prize_type").notNull(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prizeAwards = pgTable("prize_awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  prizeId: uuid("prize_id").references(() => prizes.id).notNull(),
  eraId: uuid("era_id").references(() => eras.id, { onDelete: "set null" }),
  awardedReason: text("awarded_reason").notNull(),
  status: prizeAwardStatusEnum("status").default("pending_review").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prizeShipments = pgTable("prize_shipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  prizeAwardId: uuid("prize_award_id").references(() => prizeAwards.id).notNull(),
  recipientName: text("recipient_name").notNull(),
  // Address as JSONB — collected after award, not at registration
  shippingAddress: jsonb("shipping_address").notNull(),
  trackingCode: text("tracking_code"),
  carrier: text("carrier"),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Prize = typeof prizes.$inferSelect;
export type PrizeAward = typeof prizeAwards.$inferSelect;
export type PrizeShipment = typeof prizeShipments.$inferSelect;
