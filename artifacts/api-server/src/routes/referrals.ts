import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, referralsTable, usersTable } from "@workspace/db";
import { verifyToken } from "../lib/auth";
import crypto from "crypto";

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

// GET /api/referrals/my-code
router.get("/my-code", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId));

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Generate referral code if not exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      await db
        .update(usersTable)
        .set({ referralCode })
        .where(eq(usersTable.id, req.userId));
    }

    res.json({ success: true, referralCode });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/referrals/apply
router.post("/apply", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      res.status(400).json({ success: false, message: "Referral code is required" });
      return;
    }

    // Find referrer by code
    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, referralCode.toUpperCase()));

    if (!referrer) {
      res.status(404).json({ success: false, message: "Invalid referral code" });
      return;
    }

    if (referrer.id === req.userId) {
      res.status(400).json({ success: false, message: "You cannot refer yourself" });
      return;
    }

    // Check if already referred
    const [existingReferral] = await db
      .select()
      .from(referralsTable)
      .where(and(eq(referralsTable.referredId, req.userId), eq(referralsTable.referrerId, referrer.id)));

    if (existingReferral) {
      res.status(400).json({ success: false, message: "You have already used this referral code" });
      return;
    }

    // Create referral
    const [referral] = await db
      .insert(referralsTable)
      .values({
        referrerId: referrer.id,
        referredId: req.userId,
        status: "pending",
      })
      .returning();

    // Award points to both referrer and referred
    const pointsToAward = 100;

    await db
      .update(usersTable)
      .set({ 
        rewardPoints: referrer.rewardPoints + pointsToAward,
        referredBy: referrer.id,
      })
      .where(eq(usersTable.id, req.userId));

    await db
      .update(usersTable)
      .set({ rewardPoints: referrer.rewardPoints + pointsToAward })
      .where(eq(usersTable.id, referrer.id));

    // Update referral status
    await db
      .update(referralsTable)
      .set({ 
        status: "completed",
        pointsAwarded: pointsToAward,
      })
      .where(eq(referralsTable.id, referral.id));

    res.json({ 
      success: true, 
      message: "Referral applied successfully! You earned 100 points.",
      pointsAwarded: pointsToAward,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/referrals/my-referrals
router.get("/my-referrals", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const referrals = await db
      .select({
        id: referralsTable.id,
        status: referralsTable.status,
        pointsAwarded: referralsTable.pointsAwarded,
        createdAt: referralsTable.createdAt,
        referredEmail: usersTable.email,
        referredName: usersTable.name,
      })
      .from(referralsTable)
      .leftJoin(usersTable, eq(referralsTable.referredId, usersTable.id))
      .where(eq(referralsTable.referrerId, req.userId))
      .orderBy(referralsTable.createdAt);

    res.json({ success: true, data: referrals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
