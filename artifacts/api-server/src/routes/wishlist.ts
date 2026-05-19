import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, wishlistTable, productsTable, categoriesTable, usersTable, reviewsTable } from "@workspace/db";
import { AddToWishlistBody, RemoveFromWishlistParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const wishlistItems = await db.select().from(wishlistTable).where(eq(wishlistTable.userId, userId));

  const products = await Promise.all(
    wishlistItems.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (!product) return null;

      const [category] = await db.select({ name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
      const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.productId, product.id));
      const reviewCount = reviews.length;
      const rating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null;

      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
        description: product.description,
        categoryId: product.categoryId,
        categoryName: category?.name ?? null,
        subcategory: product.subcategory,
        imageUrl: product.imageUrl,
        images: product.images ?? [],
        stock: product.stock,
        vendorId: product.vendorId,
        vendorName: null,
        rating,
        reviewCount,
        isFeatured: product.isFeatured,
        discount: product.discount ? Number(product.discount) : null,
        createdAt: product.createdAt.toISOString(),
      };
    })
  );

  res.json(products.filter((p) => p !== null));
});

router.post("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req as any).userId as number;
  const { productId } = parsed.data;

  const existing = await db.select().from(wishlistTable).where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, productId)));
  if (existing.length > 0) {
    res.json({ success: true, message: "Already in wishlist" });
    return;
  }

  await db.insert(wishlistTable).values({ userId, productId });
  res.json({ success: true, message: "Added to wishlist" });
});

router.delete("/wishlist/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFromWishlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req as any).userId as number;
  await db.delete(wishlistTable).where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, params.data.productId)));
  res.json({ success: true, message: "Removed from wishlist" });
});

export default router;
