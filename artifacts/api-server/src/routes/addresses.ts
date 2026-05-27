import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, addressesTable, usersTable } from "@workspace/db";
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
  next();
};

// GET /api/addresses
router.get("/", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const addresses = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.userId, req.userId))
      .orderBy(addressesTable.isDefault);
    res.json({ success: true, data: addresses });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/addresses
router.post("/", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

    if (isDefault) {
      await db
        .update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.userId, req.userId));
    }

    const [address] = await db
      .insert(addressesTable)
      .values({
        userId: req.userId,
        fullName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        pincode,
        country: country || "India",
        isDefault: isDefault || false,
      })
      .returning();

    res.status(201).json({ success: true, data: address });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/addresses/:id
router.put("/:id", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const { isDefault, ...updateData } = req.body;

    if (isDefault) {
      await db
        .update(addressesTable)
        .set({ isDefault: false })
        .where(eq(addressesTable.userId, req.userId));
    }

    const [address] = await db
      .update(addressesTable)
      .set(req.body)
      .where(and(eq(addressesTable.id, parseInt(req.params.id)), eq(addressesTable.userId, req.userId)))
      .returning();

    if (!address) {
      res.status(404).json({ success: false, message: "Address not found" });
      return;
    }

    res.json({ success: true, data: address });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/addresses/:id
router.delete("/:id", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    await db
      .delete(addressesTable)
      .where(and(eq(addressesTable.id, parseInt(req.params.id)), eq(addressesTable.userId, req.userId)));

    res.json({ success: true, message: "Address deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
