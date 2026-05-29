import { db } from "../lib/db/src/index";
import { ordersTable, cartsTable, usersTable, productsTable } from "../lib/db/src/schema";
import { eq, sql } from "drizzle-orm";
import { transporter } from "../artifacts/api-server/src/lib/mail";

async function main() {
  try {
    console.log("Locating seed user 'user@yelements.com'...");
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, "user@yelements.com"));
    
    if (!user) {
      console.error("User not found!");
      return;
    }

    console.log("Checking user cart...");
    let [cart] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.userId, user.id));

    if (!cart || !cart.items || cart.items.length === 0) {
      console.log("Cart is empty. Adding a mock item to user cart...");
      const [product] = await db.select().from(productsTable).limit(1);
      if (!product) {
        console.error("No products found in DB to add to cart!");
        return;
      }
      
      if (!cart) {
        [cart] = await db.insert(cartsTable).values({
          userId: user.id,
          items: [{ productId: product.id, quantity: 1 }]
        }).returning();
      } else {
        [cart] = await db.update(cartsTable).set({
          items: [{ productId: product.id, quantity: 1 }]
        }).where(eq(cartsTable.userId, user.id)).returning();
      }
    }

    console.log("Simulating order creation payload...");
    const payload = {
      shippingAddress: "Recipient: Regular User | Mobile: 9876543210 | Address: 123 Main Street | Landmark: Near Park",
      paymentMethod: "cod",
      couponDiscount: 0,
    };

    console.log("Resolving items...");
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
          imageUrl: product.imageUrl,
        };
      })
    );

    const validItems = orderItems.filter((i) => i !== null) as any[];
    const rawTotal = validItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountPercent = user.discount ?? 0;
    const total = discountPercent > 0 ? Number((rawTotal * (1 - discountPercent / 100)).toFixed(2)) : rawTotal;
    const finalTotal = Math.max(0, total - payload.couponDiscount);

    console.log("Inserting order...");
    const orderNumber = `ORD-${user.id}-${Date.now()}`;
    const insertValues: any = {
      userId: user.id,
      items: validItems,
      total: String(finalTotal),
      status: "pending",
      paymentStatus: payload.paymentMethod === "cod" ? "pending" : "paid",
      paymentMethod: payload.paymentMethod,
      shippingAddress: payload.shippingAddress,
      orderNumber,
    };

    const [order] = await db.insert(ordersTable).values(insertValues).returning();
    console.log("Order created successfully in DB:", order);

    // Clear cart
    await db
      .update(cartsTable)
      .set({ items: [], updatedAt: new Date() })
      .where(eq(cartsTable.userId, user.id));
    console.log("Cart cleared successfully.");

    // Cashback
    const cashbackAmount = Math.floor(finalTotal * 0.01);
    if (cashbackAmount > 0 && payload.paymentMethod !== "cashback") {
      await db
        .update(usersTable)
        .set({ 
          cashbackBalance: sql`cashback_balance + ${cashbackAmount}` 
        })
        .where(eq(usersTable.id, user.id));
      console.log(`Added cashback ₹${cashbackAmount}`);
    }

    console.log("Trying to send email...");
    const emailHtml = `<h2>Order Confirmed</h2>`;
    
    // Check if transporter sendMail throws
    await transporter.sendMail({
      from: `"Yelements" <${process.env.SMTP_USER || "test@test.com"}>`,
      to: user.email,
      subject: `Order Confirmed - #${order.id}`,
      html: emailHtml,
    });
    console.log("Email sent successfully!");

  } catch (err: any) {
    console.error("Order creation simulation failed with error:");
    console.error(err.message);
    console.error(err.stack);
  }
  process.exit(0);
}

main();
