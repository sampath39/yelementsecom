import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";
import { usersTable } from "./users";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  description: text("description").notNull().default(""),
  categoryId: integer("category_id").references(() => categoriesTable.id).notNull(),
  subcategory: text("subcategory"),
  imageUrl: text("image_url"),
  images: text("images").array().notNull().default([]),
  stock: integer("stock").notNull().default(0),
  vendorId: integer("vendor_id").references(() => usersTable.id),
  isFeatured: boolean("is_featured").notNull().default(false),
  discount: numeric("discount", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
