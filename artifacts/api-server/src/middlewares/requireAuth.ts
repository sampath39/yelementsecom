import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = authHeader.slice(7);

    const payload = verifyToken(token);

    // ❌ Invalid token
    if (!payload) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // ✅ attach userId
    (req as any).userId = payload.userId;

    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};