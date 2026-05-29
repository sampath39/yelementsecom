import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, sql, or, asc } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { transporter } from "../lib/mail";
import {
  db,
  ordersTable,
  cartsTable,
  productsTable,
  usersTable,
} from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, requireVendorOrAdmin } from "../lib/auth";

const router: IRouter = Router();

// ------------------ Helper functions ------------------
function formatOrder(order: typeof ordersTable.$inferSelect, userName?: string) {
  const result: any = {
    id: order.id,
    userId: order.userId,
    userName: userName ?? null,
    items: order.items ?? [],
    total: Number(order.total),
    status: order.status,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
  };
  if ('otp' in order) result.otp = (order as any).otp;
  return result;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2));
}

// ------------------ USER: GET OWN ORDERS ------------------
router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(ordersTable.createdAt);
  res.json(orders.map((o) => formatOrder(o)));
});

// ------------------ CREATE ORDER (with OTP & EMAIL) ------------------
router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req as any).userId as number;
  const [cart] = await db
    .select()
    .from(cartsTable)
    .where(eq(cartsTable.userId, userId));

  if (!cart || !cart.items || cart.items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const orderItems = await Promise.all(
    cart.items.map(async (item) => {
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
        imageUrl: product.imageUrl,
      };
    })
  );

  const validItems = orderItems.filter((i) => i !== null) as any[];
  const rawTotal = validItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  
  const [user] = await db
    .select({ email: usersTable.email, name: usersTable.name, discount: usersTable.discount, phone: usersTable.phone })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const discountPercent = user?.discount ?? 0;
  const total = discountPercent > 0 ? Number((rawTotal * (1 - discountPercent / 100)).toFixed(2)) : rawTotal;

  const otp = generateOTP();
  console.log(`🔐 Delivery OTP for order: ${otp}`);

  const couponDiscount = Number(req.body.couponDiscount || 0);
  const finalTotal = Math.max(0, total - couponDiscount);

  const orderNumber = `ORD-${userId}-${Date.now()}`;
  const insertValues: any = {
    userId,
    items: validItems,
    total: String(finalTotal),
    status: "pending",
    paymentStatus: parsed.data.paymentMethod === "cod" ? "pending" : "paid",
    paymentMethod: parsed.data.paymentMethod,
    shippingAddress: parsed.data.shippingAddress,
    orderNumber,
  };
  if ('otp' in ordersTable) insertValues.otp = otp;

  const [order] = await db.insert(ordersTable).values(insertValues).returning();

  // Clear cart
  await db
    .update(cartsTable)
    .set({ items: [], updatedAt: new Date() })
    .where(eq(cartsTable.userId, userId));

  // ---------- ADD 1% CASHBACK TO USER WALLET ----------
  const cashbackAmount = Math.floor(finalTotal * 0.01); // 1% cashback
  if (cashbackAmount > 0 && parsed.data.paymentMethod !== "cashback") {
    await db
      .update(usersTable)
      .set({ 
        cashbackBalance: sql`cashback_balance + ${cashbackAmount}` 
      })
      .where(eq(usersTable.id, userId));
    console.log(`💰 Added ₹${cashbackAmount} cashback to user ${userId}`);
  }

  // ---------- DEDUCT CASHBACK IF PAYMENT METHOD IS CASHBACK ----------
  if (parsed.data.paymentMethod === "cashback") {
    const [currentUser] = await db
      .select({ cashbackBalance: usersTable.cashbackBalance })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!currentUser || currentUser.cashbackBalance < finalTotal) {
      res.status(400).json({ error: "Insufficient cashback balance" });
      return;
    }

    await db
      .update(usersTable)
      .set({ 
        cashbackBalance: sql`cashback_balance - ${finalTotal}` 
      })
      .where(eq(usersTable.id, userId));
    console.log(`💸 Deducted ₹${finalTotal} from cashback for user ${userId}`);
  }

  // ---------- SEND CONFIRMATION EMAIL (non‑blocking) ----------
  if (user && user.email) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmed ✅</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Your order <strong>#${order.id}</strong> has been placed successfully.</p>
        <p><strong>Total Amount:</strong> ₹${total}</p>
        <p><strong>Shipping Address:</strong> ${parsed.data.shippingAddress}</p>
        <p>We'll notify you once your order is shipped.</p>
        <br/>
        <p>Thanks for shopping with Yelements!</p>
      </div>
    `;

    transporter.sendMail({
      from: `"Yelements" <${process.env.SMTP_USER}>`,
      to: user.email,
      bcc: "sampath777yt@gmail.com",
      subject: `Order Confirmed - #${order.id}`,
      html: emailHtml,
    }).catch((err: any) => {
      console.error(`Failed to send order confirmation email for order ${order.id}:`, err);
    });
  } else {
    console.warn(`User ${userId} has no email – cannot send confirmation.`);
  }

  res.status(201).json(formatOrder(order));
});

// ------------------ GET SINGLE ORDER ------------------
router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req as any).userId as number;
  const userRole = (req as any).userRole as string;
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.userId !== userId && userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(formatOrder(order));
});

// ------------------ ADMIN: UPDATE ORDER STATUS ------------------
router.patch("/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(parsed.data.status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  // Check if order is already delivered
  const [existingOrder] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!existingOrder) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (existingOrder.status === "delivered") {
    res.status(400).json({ error: "Cannot change status of delivered order" });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status as any })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(formatOrder(order));
});

// ------------------ ADMIN: GET ALL ORDERS ------------------
router.get("/admin/orders", requireAdmin, async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(ordersTable.createdAt);
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable);
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  res.json(orders.map((o) => formatOrder(o, userMap.get(o.userId))));
});

// ------------------ ADMIN: VERIFY OTP ------------------
router.post("/orders/:id/verify-otp", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { otp } = req.body;
    if (!otp) {
      res.status(400).json({ error: "OTP is required" });
      return;
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if ((order as any).otp !== otp) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    const [updated] = await db
      .update(ordersTable)
      .set({ status: "delivered", paymentStatus: "paid" })
      .where(eq(ordersTable.id, id))
      .returning();

    res.json({ message: "OTP verified, order delivered", order: formatOrder(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ------------------ VENDOR: SEND OTP VIA SMS ------------------
router.post("/orders/:id/send-otp", requireVendorOrAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.status !== "shipped") {
      res.status(400).json({ error: "Order must be shipped before sending OTP" });
      return;
    }

    if (!(order as any).otp) {
      res.status(400).json({ error: "No OTP available for this order" });
      return;
    }

    // Get user phone number
    const [user] = await db
      .select({ phone: usersTable.phone })
      .from(usersTable)
      .where(eq(usersTable.id, order.userId));

    if (!user || !user.phone) {
      res.status(400).json({ error: "Customer phone number not available" });
      return;
    }

    // TODO: Integrate with SMS service (Twilio, etc.)
    // For now, log the OTP that would be sent
    console.log(`📱 SMS would be sent to ${user.phone}: Your delivery OTP is ${(order as any).otp}`);

    res.json({ message: "OTP sent to customer", phone: user.phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ------------------ VENDOR: VERIFY OTP ------------------
router.post("/orders/:id/vendor-verify-otp", requireVendorOrAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { otp } = req.body;
    if (!otp) {
      res.status(400).json({ error: "OTP is required" });
      return;
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Check if order is already delivered
    if (order.status === "delivered") {
      res.status(400).json({ error: "Order is already delivered" });
      return;
    }

    if ((order as any).otp !== otp) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    const [updated] = await db
      .update(ordersTable)
      .set({ status: "delivered", paymentStatus: "paid" })
      .where(eq(ordersTable.id, id))
      .returning();

    res.json({ message: "OTP verified, order delivered", order: formatOrder(updated) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ------------------ SIMULATION: AUTO DELIVERY ------------------
router.post("/orders/:id/auto-delivery", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: "Driver coordinates (lat, lng) required" });
      return;
    }

    const driver = { lat, lng };
    const customerLocation = { lat: 17.45, lng: 78.40 };

    const distance = getDistance(driver, customerLocation);
    if (distance < 0.01) {
      const [updated] = await db
        .update(ordersTable)
        .set({ status: "delivered", paymentStatus: "paid" })
        .where(eq(ordersTable.id, id))
        .returning();
      res.json({ message: "Auto delivered ✅", order: updated ? formatOrder(updated) : null });
      return;
    }
    res.json({ message: "Still delivering...", distance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Auto delivery simulation failed" });
  }
});

// ------------------ TEST EMAIL ROUTE (remove after testing) ------------------
router.get("/test-email", async (req, res) => {
  try {
    const testEmail = req.query.to || "your-email@gmail.com";
    await transporter.sendMail({
      from: `"Yelements Test" <${process.env.SMTP_USER}>`,
      to: testEmail as string,
      subject: "SMTP Test",
      text: "If you receive this, your email configuration is working!",
    });
    res.send("✅ Test email sent. Check your inbox.");
  } catch (err: any) {
    console.error(err);
    res.status(500).send(`❌ Failed: ${err.message}`);
  }
});

export default router;
