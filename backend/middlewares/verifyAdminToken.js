// 📁 backend/middlewares/verifyAdminToken.js
import jwt from "jsonwebtoken";
import { isAdmin } from "../utils/roles.js";

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || "devsecret";

export function verifyAdminToken(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    let token = null;

    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
    token ||= req.headers["x-access-token"] || req.headers["x-admin-token"];
    if (!token && req.cookies?.adminToken) token = req.cookies.adminToken;
    if (!token) return res.status(401).json({ error: "NO_TOKEN" });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: err?.name || "INVALID_TOKEN" });
    }

    const who = payload.admin || payload.user || payload || {};
    req.admin = who;

    if (!isAdmin(who)) return res.status(403).json({ error: "FORBIDDEN_ADMIN_ONLY" });
    next();
  } catch {
    return res.status(401).json({ error: "AUTH_FAIL" });
  }
}
