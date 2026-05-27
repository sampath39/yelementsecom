import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable, productsTable, ordersTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [productCount] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable);
  const [orderCount] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable);

  const revenueResult = await db.select({ total: sql<string>`sum(total)` }).from(ordersTable);
  const totalRevenue = Number(revenueResult[0]?.total ?? 0);

  const pendingResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(sql`status = 'pending'`);
  const pendingOrders = pendingResult[0]?.count ?? 0;

  const lowStockResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(sql`stock < 10`);
  const lowStockProducts = lowStockResult[0]?.count ?? 0;

  // Daily sales and orders
  const dailyResult = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<string>`sum(total)`
    })
    .from(ordersTable)
    .where(sql`DATE(created_at) = CURRENT_DATE`);
  const dailyOrders = dailyResult[0]?.count ?? 0;
  const dailyRevenue = Number(dailyResult[0]?.total ?? 0);

  // Monthly sales and orders
  const monthlyResult = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<string>`sum(total)`
    })
    .from(ordersTable)
    .where(sql`DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`);
  const monthlyOrders = monthlyResult[0]?.count ?? 0;
  const monthlyRevenue = Number(monthlyResult[0]?.total ?? 0);

  const recentOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(sql`created_at desc`)
    .limit(10);

  const topProducts = await db
    .select()
    .from(productsTable)
    .limit(5);

  res.json({
    totalUsers: userCount?.count ?? 0,
    totalProducts: productCount?.count ?? 0,
    totalOrders: orderCount?.count ?? 0,
    totalRevenue,
    pendingOrders,
    lowStockProducts,
    dailyOrders,
    dailyRevenue,
    monthlyOrders,
    monthlyRevenue,
    recentOrders: recentOrders.map((o) => ({
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
    topProducts: topProducts.map((p) => ({
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
