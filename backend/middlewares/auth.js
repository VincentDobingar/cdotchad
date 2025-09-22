// 📁 ~/public_html/backend/middlewares/auth.js
import jwt from "jsonwebtoken";
import { verifyAdminToken as _verifyAdminToken } from "./verifyAdminToken.js";

const JWT_SECRET = process.env.JWT_SECRET || "cdosecret123";

/**
 * ✅ Auth “utilisateur” générique (non-admin)
 * - Bearer <token> OU x-access-token / x-user-token OU cookie userToken
 * - Pose req.user
 */
export function verifyUserToken(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    let token = null;

    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
    token ||= req.headers["x-access-token"] || req.headers["x-user-token"];
    if (!token && req.cookies?.userToken) token = req.cookies.userToken;

    if (!token) return res.status(401).json({ message: "Token manquant" });

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload.user || payload.admin || payload;
    return next();
  } catch (e) {
    console.error("verifyUserToken:", e?.message);
    return res.status(401).json({ message: "Token invalide" });
  }
}

/** ✅ Garde admin (ré-export du middleware dédié) */
export const verifyAdminToken = _verifyAdminToken;

/** ✅ Aliases (pour compat avec les imports existants) */
export const requireAuth = verifyUserToken;
export const adminOnly = _verifyAdminToken;
