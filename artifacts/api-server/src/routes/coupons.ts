import { Router, type IRouter } from "express";
import { eq, and, gt, lt } from "drizzle-orm";
import { db, couponsTable, usersTable } from "@workspace/db";
import { verifyToken } from "../lib/auth";

const router: IRouter = Router();

// Middleware to verify token
const authMiddleware = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  req.userId = payload.userId;
  req.userRole = payload.role;
  next();
};

// Admin middleware
const adminMiddleware = async (req: any, res: any, next: any) => {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

// POST /api/coupons/validate
router.post("/validate", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const { code, cartTotal } = req.body;

    const [coupon] = await db
      .select()
      .from(couponsTable)
      .where(and(eq(couponsTable.code, code.toUpperCase()), eq(couponsTable.isActive, true)));

    if (!coupon) {
      res.status(404).json({ success: false, message: "Invalid coupon code" });
      return;
    }

    if (coupon.userId && coupon.userId !== req.userId) {
      res.status(403).json({ success: false, message: "This coupon is not valid for your account" });
      return;
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ success: false, message: "Coupon has expired" });
      return;
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ success: false, message: "Coupon usage limit reached" });
      return;
    }

    if (parseFloat(cartTotal) < parseFloat(coupon.minOrderValue.toString())) {
      res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrderValue} required` });
      return;
    }

    const discount = coupon.type === "percentage"
      ? Math.min((parseFloat(cartTotal) * parseFloat(coupon.value.toString())) / 100, coupon.maxDiscount ? parseFloat(coupon.maxDiscount.toString()) : Infinity)
      : parseFloat(coupon.value.toString());

    res.json({ success: true, coupon, discount: Math.round(discount) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coupons - admin
router.get("/", authMiddleware, adminMiddleware, async (req: any, res): Promise<void> => {
  try {
    const coupons = await db
      .select()
      .from(couponsTable)
      .orderBy(couponsTable.createdAt);

    res.json({ success: true, data: coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coupons - admin
router.post("/", authMiddleware, adminMiddleware, async (req: any, res): Promise<void> => {
  try {
    const [coupon] = await db
      .insert(couponsTable)
      .values({
        ...req.body,
        code: req.body.code.toUpperCase(),
      })
      .returning();

    res.status(201).json({ success: true, data: coupon });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/coupons/:id - admin
router.put("/:id", authMiddleware, adminMiddleware, async (req: any, res): Promise<void> => {
  try {
    const [coupon] = await db
      .update(couponsTable)
      .set(req.body)
      .where(eq(couponsTable.id, parseInt(req.params.id)))
      .returning();

    if (!coupon) {
      res.status(404).json({ success: false, message: "Coupon not found" });
      return;
    }

    res.json({ success: true, data: coupon });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/coupons/:id - admin
router.delete("/:id", authMiddleware, adminMiddleware, async (req: any, res): Promise<void> => {
  try {
    await db
      .delete(couponsTable)
      .where(eq(couponsTable.id, parseInt(req.params.id)));

    res.json({ success: true, message: "Coupon deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
