import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const redeemedStatusEnum = pgEnum("redeemed_status", ["pending", "approved", "rejected", "completed"]);

export const redeemedProductsTable = pgTable("redeemed_products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  productId: integer("product_id").references(() => productsTable.id),
  pointsUsed: integer("points_used").notNull(),
  cashPaid: numeric("cash_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  status: redeemedStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRedeemedProductSchema = createInsertSchema(redeemedProductsTable).omit({ id: true, createdAt: true });
export type InsertRedeemedProduct = z.infer<typeof insertRedeemedProductSchema>;
export type RedeemedProduct = typeof redeemedProductsTable.$inferSelect;
