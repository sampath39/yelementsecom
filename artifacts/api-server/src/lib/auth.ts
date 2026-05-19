import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";

// 🔐 HASH PASSWORD (using bcrypt for consistency with seed data)
export function hashPassword(password: string): string {
  // bcrypt hash with a salt round of 10 (synchronous for simplicity)
  return bcrypt.hashSync(password, 10);
}

// 🔑 GENERATE TOKEN (with expiry)
export function generateToken(userId: number, role: string): string {
  const expiresIn = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  const payload = `${userId}:${role}:${expiresIn}`;
  const secret = process.env.SESSION_SECRET || "secret";

  const signature = crypto
    .createHash("sha256")
    .update(payload + secret)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64");
}

// 🔍 VERIFY TOKEN
export function verifyToken(
  token: string
): { userId: number; role: string } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");

    if (parts.length < 4) return null;

    const userId = parseInt(parts[0], 10);
    const role = parts[1];
    const expires = parseInt(parts[2], 10);
    const signature = parts[3];

    const payload = `${userId}:${role}:${expires}`;
    const secret = process.env.SESSION_SECRET || "secret";

    const expectedSignature = crypto
      .createHash("sha256")
      .update(payload + secret)
      .digest("hex");

    // ❌ invalid signature
    if (signature !== expectedSignature) return null;

    // ❌ expired token
    if (Date.now() > expires) return null;

    return { userId, role };
  } catch {
    return null;
  }
}

// 🔒 REQUIRE AUTH
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  (req as any).userId = payload.userId;
  (req as any).userRole = payload.role;

  next();
}

// 👑 ADMIN ONLY
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if ((req as any).userRole !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    next();
  });
}

// 🏪 VENDOR ONLY ✅ (NEW)
export function requireVendor(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if ((req as any).userRole !== "vendor") {
      res.status(403).json({ error: "Vendor only" });
      return;
    }
    next();
  });
}

// 🏪 VENDOR OR ADMIN
export function requireVendorOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    const role = (req as any).userRole;

    if (role !== "admin" && role !== "vendor") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  });
}

// 🔓 OPTIONAL AUTH
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (payload) {
      (req as any).userId = payload.userId;
      (req as any).userRole = payload.role;
    }
  }

  next();
}