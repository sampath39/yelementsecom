import { z } from "zod";

// ✅ Schema that tolerates backend issues
export const ProductSchema = z.object({
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

// ✅ SAFE TYPE for UI
export type SafeProduct = z.infer<typeof ProductSchema>;