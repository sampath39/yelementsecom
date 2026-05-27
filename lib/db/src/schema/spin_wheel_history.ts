import { pgTable, serial, timestamp, text, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const spinRewardTypeEnum = pgEnum("spin_reward_type", ["points", "coupon", "discount", "nothing"]);

export const spinWheelHistoryTable = pgTable("spin_wheel_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  spinDate: timestamp("spin_date").notNull().defaultNow(),
  rewardType: spinRewardTypeEnum("reward_type"),
  rewardValue: text("reward_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSpinWheelHistorySchema = createInsertSchema(spinWheelHistoryTable).omit({ id: true, createdAt: true });
export type InsertSpinWheelHistory = z.infer<typeof insertSpinWheelHistorySchema>;
export type SpinWheelHistory = typeof spinWheelHistoryTable.$inferSelect;
