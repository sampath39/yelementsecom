import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, cartsTable, productsTable, usersTable } from "@workspace/db";
import { AddToCartBody, UpdateCartItemBody, UpdateCartItemParams, RemoveFromCartParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function getOrCreateCart(userId: number) {
  const [existing] = await db.select().from(cartsTable).where(eq(cartsTable.userId, userId));
  if (existing) return existing;
  const [created] = await db.insert(cartsTable).values({ userId, items: [] }).returning();
  return created;
}

async function buildCartResponse(userId: number) {
  const cart = await getOrCreateCart(userId);
  const items = cart.items ?? [];

  const enriched = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl,
        quantity: item.quantity,
        stock: product.stock,
      };
    })
  );

  const validItems = enriched.filter((i) => i !== null) as NonNullable<(typeof enriched)[number]>[];
  const rawSubtotal = validItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const [user] = await db.select({ discount: usersTable.discount }).from(usersTable).where(eq(usersTable.id, userId));
  const discountPercent = user?.discount ?? 0;
  const subtotal = discountPercent > 0 ? Number((rawSubtotal * (1 - discountPercent / 100)).toFixed(2)) : rawSubtotal;

  return {
    items: validItems,
    subtotal,
    itemCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
  };
}

router.get("/cart", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  res.json(await buildCartResponse(userId));
});

router.post("/cart", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req as any).userId as number;
  const { productId, quantity } = parsed.data;

  const cart = await getOrCreateCart(userId);
  const items = [...(cart.items ?? [])];
  const existingIdx = items.findIndex((i) => i.productId === productId);

  if (existingIdx >= 0) {
    items[existingIdx] = { ...items[existingIdx], quantity: items[existingIdx].quantity + quantity };
  } else {
    items.push({ productId, quantity });
  }

  await db.update(cartsTable).set({ items, updatedAt: new Date() }).where(eq(cartsTable.userId, userId));

  res.json(await buildCartResponse(userId));
});

router.put("/cart/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req as any).userId as number;
  const cart = await getOrCreateCart(userId);
  let items = [...(cart.items ?? [])];

  if (parsed.data.quantity <= 0) {
    items = items.filter((i) => i.productId !== params.data.productId);
  } else {
    const idx = items.findIndex((i) => i.productId === params.data.productId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: parsed.data.quantity };
    }
  }

  await db.update(cartsTable).set({ items, updatedAt: new Date() }).where(eq(cartsTable.userId, userId));

  res.json(await buildCartResponse(userId));
});

router.delete("/cart/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFromCartParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req as any).userId as number;
  const cart = await getOrCreateCart(userId);
  const items = (cart.items ?? []).filter((i) => i.productId !== params.data.productId);

  await db.update(cartsTable).set({ items, updatedAt: new Date() }).where(eq(cartsTable.userId, userId));

  res.json(await buildCartResponse(userId));
});

router.delete("/cart", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  await db.update(cartsTable).set({ items: [], updatedAt: new Date() }).where(eq(cartsTable.userId, userId));
  res.json({ success: true, message: "Cart cleared" });
});

export default router;
