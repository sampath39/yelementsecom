import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
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

// GET /api/notifications
router.get("/", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    res.json({ success: true, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, req.userId), eq(notificationsTable.isRead, false)));

    res.json({ success: true, count: result[0]?.count || 0 });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    const [notification] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, parseInt(req.params.id)), eq(notificationsTable.userId, req.userId)))
      .returning();

    if (!notification) {
      res.status(404).json({ success: false, message: "Notification not found" });
      return;
    }

    res.json({ success: true, data: notification });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/mark-all-read
router.put("/mark-all-read", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, req.userId));

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", authMiddleware, async (req: any, res): Promise<void> => {
  try {
    await db
      .delete(notificationsTable)
      .where(and(eq(notificationsTable.id, parseInt(req.params.id)), eq(notificationsTable.userId, req.userId)));

    res.json({ success: true, message: "Notification deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper function to create notification (can be used by other routes)
export async function createNotification(userId: number, title: string, message: string, type: "info" | "order" | "reward" | "promotion" | "alert" = "info", link?: string) {
  try {
    await db
      .insert(notificationsTable)
      .values({
        userId,
        title,
        message,
        type,
        link,
      });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

export default router;
