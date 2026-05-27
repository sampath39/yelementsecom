import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, rewardPointsTable, usersTable, dailyCheckinsTable, spinWheelHistoryTable } from "@workspace/db";
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

// GET /api/rewards/balance
router.get("/balance", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId));

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, balance: user.rewardPoints });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/rewards/history
router.get("/history", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const history = await db
      .select()
      .from(rewardPointsTable)
      .where(eq(rewardPointsTable.userId, req.userId))
      .orderBy(desc(rewardPointsTable.createdAt))
      .limit(50);

    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rewards/checkin
router.post("/checkin", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Check if already checked in today using date range
    const existing = await db
      .select()
      .from(dailyCheckinsTable)
      .where(and(
        eq(dailyCheckinsTable.userId, req.userId),
        sql`${dailyCheckinsTable.checkinDate} >= ${todayStart} AND ${dailyCheckinsTable.checkinDate} < ${todayEnd}`
      ));

    if (existing.length > 0) {
      res.status(400).json({ success: false, message: "Already checked in today" });
      return;
    }

    // Calculate streak
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    const yesterdayCheckin = await db
      .select()
      .from(dailyCheckinsTable)
      .where(and(
        eq(dailyCheckinsTable.userId, req.userId),
        sql`${dailyCheckinsTable.checkinDate} >= ${yesterdayStart} AND ${dailyCheckinsTable.checkinDate} < ${yesterdayEnd}`
      ));

    const streakDays = yesterdayCheckin.length > 0 ? (yesterdayCheckin[0].streakDays + 1) : 1;
    const pointsEarned = Math.min(5 * streakDays, 50); // Max 50 points per day

    // Create checkin record
    await db
      .insert(dailyCheckinsTable)
      .values({
        userId: req.userId,
        checkinDate: today,
        pointsEarned,
        streakDays,
      });

    // Award points using SQL increment
    await db
      .update(usersTable)
      .set({
        rewardPoints: sql`${usersTable.rewardPoints} + ${pointsEarned}`,
      })
      .where(eq(usersTable.id, req.userId));

    // Add to reward history
    await db
      .insert(rewardPointsTable)
      .values({
        userId: req.userId,
        points: pointsEarned,
        type: "checkin",
        description: `Daily check-in - ${streakDays} day streak`,
      });

    res.json({ 
      success: true, 
      pointsEarned,
      streakDays,
      message: `Checked in! Earned ${pointsEarned} points.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/rewards/checkin-status
router.get("/checkin-status", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayCheckin = await db
      .select()
      .from(dailyCheckinsTable)
      .where(and(
        eq(dailyCheckinsTable.userId, req.userId),
        sql`${dailyCheckinsTable.checkinDate} >= ${todayStart} AND ${dailyCheckinsTable.checkinDate} < ${todayEnd}`
      ));

    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    const yesterdayCheckin = await db
      .select()
      .from(dailyCheckinsTable)
      .where(and(
        eq(dailyCheckinsTable.userId, req.userId),
        sql`${dailyCheckinsTable.checkinDate} >= ${yesterdayStart} AND ${dailyCheckinsTable.checkinDate} < ${yesterdayEnd}`
      ));

    const streakDays = yesterdayCheckin.length > 0 ? yesterdayCheckin[0].streakDays : 0;

    res.json({ 
      success: true, 
      hasCheckedIn: todayCheckin.length > 0,
      streakDays,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rewards/spin
router.post("/spin", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Check if already spun today
    const existing = await db
      .select()
      .from(spinWheelHistoryTable)
      .where(and(
        eq(spinWheelHistoryTable.userId, req.userId),
        sql`${spinWheelHistoryTable.spinDate} >= ${todayStart} AND ${spinWheelHistoryTable.spinDate} < ${todayEnd}`
      ));

    if (existing.length > 0) {
      res.status(400).json({ success: false, message: "Already spun today" });
      return;
    }

    // Random reward
    const rewards = [
      { type: "points", value: "10", weight: 30 },
      { type: "points", value: "20", weight: 20 },
      { type: "points", value: "50", weight: 10 },
      { type: "coupon", value: "10OFF", weight: 5 },
      { type: "discount", value: "5%", weight: 15 },
      { type: "nothing", value: "", weight: 20 },
    ];

    const totalWeight = rewards.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedReward = rewards[0];

    for (const reward of rewards) {
      if (random < reward.weight) {
        selectedReward = reward;
        break;
      }
      random -= reward.weight;
    }

    // Create spin history
    await db
      .insert(spinWheelHistoryTable)
      .values({
        userId: req.userId,
        spinDate: today,
        rewardType: selectedReward.type as "points" | "coupon" | "discount" | "nothing",
        rewardValue: selectedReward.value,
      });

    let pointsAwarded = 0;
    if (selectedReward.type === "points") {
      pointsAwarded = parseInt(selectedReward.value);
      await db
        .update(usersTable)
        .set({
          rewardPoints: sql`${usersTable.rewardPoints} + ${pointsAwarded}`,
        })
        .where(eq(usersTable.id, req.userId));

      await db
        .insert(rewardPointsTable)
        .values({
          userId: req.userId,
          points: pointsAwarded,
          type: "spin",
          description: `Spin wheel reward`,
        });
    }

    res.json({ 
      success: true, 
      reward: selectedReward,
      pointsAwarded,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/rewards/spin-status
router.get("/spin-status", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todaySpin = await db
      .select()
      .from(spinWheelHistoryTable)
      .where(and(
        eq(spinWheelHistoryTable.userId, req.userId),
        sql`${spinWheelHistoryTable.spinDate} >= ${todayStart} AND ${spinWheelHistoryTable.spinDate} < ${todayEnd}`
      ));

    res.json({ 
      success: true, 
      hasSpun: todaySpin.length > 0,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
