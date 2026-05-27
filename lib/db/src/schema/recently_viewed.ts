import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const recentlyViewedTable = pgTable("recently_viewed", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => productsTable.id, { onDelete: "cascade" }).notNull(),
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
});

export const insertRecentlyViewedSchema = createInsertSchema(recentlyViewedTable).omit({ id: true, viewedAt: true });
export type InsertRecentlyViewed = z.infer<typeof insertRecentlyViewedSchema>;
export type RecentlyViewed = typeof recentlyViewedTable.$inferSelect;
