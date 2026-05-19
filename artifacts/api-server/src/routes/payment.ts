import dotenv from "dotenv";
dotenv.config();

import { Router } from "express";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";
import { requireAuth } from "../lib/auth";
import { db, cartsTable, ordersTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// ================= STRIPE =================
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log("✅ Stripe initialized");
} else {
  console.warn("⚠️ STRIPE_SECRET_KEY missing");
}

// ✅ CREATE PAYMENT INTENT (STRIPE)
router.post("/create-payment-intent", requireAuth, async (req, res): Promise<void> => {
  if (!stripe) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  try {
    const userId = (req as any).userId;
    const { amount, address } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "inr",
      metadata: {
        userId: String(userId),
        address: address || "",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Stripe payment failed" });
  }
});

// ================= RAZORPAY =================
let razorpay: Razorpay | null = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("✅ Razorpay initialized");
} else {
  console.warn("⚠️ Razorpay keys missing");
}

// ✅ CREATE ORDER (RAZORPAY)
router.post("/razorpay/create-order", requireAuth, async (req, res): Promise<void> => {
  if (!razorpay) {
    res.status(503).json({ error: "Razorpay not configured" });
    return;
  }

  try {
    const userId = (req as any).userId;
    const { amount, address } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        userId: String(userId),
        address: address || "",
      },
    });

    res.json(order);
  } catch (err: any) {
    console.error("Razorpay create error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ VERIFY PAYMENT (RAZORPAY)
router.post("/razorpay/verify", requireAuth, async (req, res): Promise<void> => {
  if (!razorpay) {
    res.status(503).json({ error: "Razorpay not configured" });
    return;
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: "Missing payment data" });
      return;
    }

    const userId = (req as any).userId;

    // 🔐 VERIFY SIGNATURE
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      res.status(400).json({ error: "Invalid payment signature" });
      return;
    }

    // 🛒 GET CART
    const [cart] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.userId, userId));

    if (!cart || !cart.items?.length) {
      res.status(400).json({ error: "Cart empty" });
      return;
    }

    // 🛒 MAP CART ITEMS WITH FULL DETAILS FROM PRODUCTS TABLE
    const orderItems = await Promise.all(
      cart.items.map(async (item: any) => {
        const [product] = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, item.productId));

        if (!product) return null;

        return {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: item.quantity,
          imageUrl: product.imageUrl || null,
        };
      })
    );

    const validItems = orderItems.filter((i) => i !== null) as any[];

    if (!validItems.length) {
      res.status(400).json({ error: "No valid products in cart" });
      return;
    }

    // 💰 CALCULATE TOTAL
    const couponDiscount = Number(req.body.couponDiscount || 0);
    const total = Math.max(0, validItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) - couponDiscount);

    // 📦 CREATE ORDER
    await db.insert(ordersTable).values({
      userId,
      items: validItems,
      total: String(total),
      status: "confirmed",
      shippingAddress: req.body.address || "Paid via Razorpay",
      paymentMethod: "razorpay",
    });

    // 🧹 CLEAR CART
    await db
      .update(cartsTable)
      .set({ items: [] })
      .where(eq(cartsTable.userId, userId));

    res.json({ success: true });
  } catch (err: any) {
    console.error("Razorpay verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;