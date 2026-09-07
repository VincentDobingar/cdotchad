// 📁 backend/middlewares/requireRole.js
// Middleware d'autorisation unique, remplace verifyAdminToken.js, verifySuperAdmin.js
// et middlewares/auth.js. Un seul rôle par compte (table `users`), un seul secret JWT.
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * requireRole("admin", "superadmin") -> exige d'être connecté avec l'un de ces rôles
 * requireRole() sans argument -> exige juste d'être connecté, peu importe le rôle
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "NO_TOKEN" });
    }
    const token = auth.slice(7);

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: err?.name || "INVALID_TOKEN" });
    }

    if (roles.length > 0 && !roles.includes(payload.role)) {
      return res.status(403).json({ error: "FORBIDDEN_ROLE" });
    }

    req.user = { id: payload.id, email: payload.email, role: payload.role };
    // Alias de compatibilité : les contrôleurs existants lisent encore req.admin.
    req.admin = req.user;
    next();
  };
}
