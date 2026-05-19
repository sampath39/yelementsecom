import { Product } from "@workspace/api-client-react";
import { z } from "zod";

// ✅ SCHEMA
const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),

  description: z.string().optional(),
  imageUrl: z.string().optional(),

  categoryName: z.string().optional(),
  stock: z.number().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),

  discount: z.number().optional(),
  originalPrice: z.number().optional(),
  isFeatured: z.boolean().optional(),
  createdAt: z.string().optional(),
});

// ✅ TYPE
export type SafeProduct = z.infer<typeof ProductSchema>;

// ✅ CATEGORY MAP (🔥 IMPORTANT FIX)
const categoryMap: Record<number, string> = {
  2: "Stationery",
  3: "Medical",
  4: "Laboratory",
  5: "Surgical",
  6: "Canteen",
  7: "Housekeeping",
  8: "Miscellaneous",
};

// ✅ NORMALIZE ONE PRODUCT
export function normalizeProduct(p: Product): SafeProduct {
  return {
    id: p.id,
    name: p.name ?? "Unnamed Product",

    // ✅ FIX: price string → number
    price: Number(p.price ?? 0),

    description: p.description ?? "",
    imageUrl: p.imageUrl ?? "",

    // 🔥 MAIN FIX: always map categoryId
    categoryName:
      categoryMap[p.categoryId as number] ||
      p.categoryName ||
      "General",

    stock: p.stock ?? 0,
    rating: p.rating ?? 4,
    reviewCount: p.reviewCount ?? 0,

    discount: p.discount ?? 0,
    originalPrice: Number(p.originalPrice ?? p.price ?? 0),
    isFeatured: p.isFeatured ?? false,
    createdAt: (p as any).createdAt,
  };
}

// ✅ NORMALIZE ARRAY
export function normalizeProducts(products: Product[]): SafeProduct[] {
  return products.map(normalizeProduct);
}