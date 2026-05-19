import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reviewsTable, usersTable, productsTable } from "@workspace/db";
import { CreateReviewBody, CreateReviewParams, GetProductReviewsParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = GetProductReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, params.data.id));

  const enriched = await Promise.all(
    reviews.map(async (review) => {
      const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, review.userId));
      return {
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        userName: user?.name ?? "Anonymous",
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      };
    })
  );

  res.json(enriched);
});

router.post("/products/:id/reviews", requireAuth, async (req, res): Promise<void> => {
  const params = CreateReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req as any).userId as number;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (parsed.data.rating < 1 || parsed.data.rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    productId: params.data.id,
    userId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  }).returning();

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: user?.name ?? "Anonymous",
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
