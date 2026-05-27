import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { ordersTable } from "./orders";

export const rewardTypeEnum = pgEnum("reward_type", ["earned", "redeemed", "bonus", "referral", "checkin", "spin"]);

export const rewardPointsTable = pgTable("reward_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  points: integer("points").notNull(),
  type: rewardTypeEnum("type").notNull(),
  description: text("description"),
  orderId: integer("order_id").references(() => ordersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRewardPointsSchema = createInsertSchema(rewardPointsTable).omit({ id: true, createdAt: true });
export type InsertRewardPoints = z.infer<typeof insertRewardPointsSchema>;
export type RewardPoints = typeof rewardPointsTable.$inferSelect;
