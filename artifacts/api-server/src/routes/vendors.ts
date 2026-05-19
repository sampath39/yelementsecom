import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, productsTable, ordersTable } from "@workspace/db";
import { GetVendorParams, GetVendorStatsParams } from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/vendors", requireAdmin, async (_req, res): Promise<void> => {
  const vendors = await db.select().from(usersTable).where(eq(usersTable.role, "vendor"));

  const result = await Promise.all(
    vendors.map(async (v) => {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(productsTable)
        .where(eq(productsTable.vendorId, v.id));

      return {
        id: v.id,
        name: v.name,
        email: v.email,
        productCount: countResult?.count ?? 0,
        createdAt: v.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.get("/vendors/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vendor] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!vendor || vendor.role !== "vendor") {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.vendorId, vendor.id));

  res.json({
    id: vendor.id,
    name: vendor.name,
    email: vendor.email,
    productCount: countResult?.count ?? 0,
    createdAt: vendor.createdAt.toISOString(),
  });
});

router.get("/vendors/:id/stats", requireAuth, async (req, res): Promise<void> => {
  const params = GetVendorStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const requestingUserId = (req as any).userId as number;
  const requestingRole = (req as any).userRole as string;

  if (params.data.id !== requestingUserId && requestingRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const products = await db.select().from(productsTable).where(eq(productsTable.vendorId, params.data.id));

  const productIds = products.map((p) => p.id);

  // Get all orders and filter those containing vendor's products
  const allOrders = await db.select().from(ordersTable).orderBy(sql`created_at desc`);

  const vendorOrders = allOrders.filter((order) => {
    const items = order.items ?? [];
    return items.some((item) => productIds.includes(item.productId));
  });

  const totalRevenue = vendorOrders.reduce((sum, o) => {
    const items = (o.items ?? []).filter((item) => productIds.includes(item.productId));
    return sum + items.reduce((s, i) => s + i.price * i.quantity, 0);
  }, 0);

  res.json({
    totalProducts: products.length,
    totalOrders: vendorOrders.length,
    totalRevenue,
    recentOrders: vendorOrders.slice(0, 5).map((o) => ({
      id: o.id,
      userId: o.userId,
      userName: null,
      items: o.items ?? [],
      total: Number(o.total),
      status: o.status,
      shippingAddress: o.shippingAddress,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt.toISOString(),
    })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      description: p.description,
      categoryId: p.categoryId,
      categoryName: null,
      subcategory: p.subcategory,
      imageUrl: p.imageUrl,
      images: p.images ?? [],
      stock: p.stock,
      vendorId: p.vendorId,
      vendorName: null,
      rating: null,
      reviewCount: 0,
      isFeatured: p.isFeatured,
      discount: p.discount ? Number(p.discount) : null,
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

export default router;
