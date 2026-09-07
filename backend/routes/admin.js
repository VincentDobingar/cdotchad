// 📁 routes/admin.js
import express from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { pool } from "../config/db.js";

// 🔐 Middlewares
import { requireRole } from "../middlewares/requireRole.js";

// 📥 Contrôleurs principaux
import {
  loginAdmin,
  ajouterAdministrateur,
  getAllAdmins,
  deleteAdmin,
  getAdminMe,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshSession,
} from "../controllers/admin.controller.js";

const router = express.Router();

/* ---------------------------
   🛡️ Rate limit UNIQUEMENT sur /login (IPv6-safe)
---------------------------- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 min
  limit: 10,                    // 10 tentatives / fenêtre / IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // ✅ important pour IPv6
  message: { error: "TOO_MANY_LOGIN_ATTEMPTS" },
});

// ❌ Supprimé: router.use(adminLimiter);  // (ça posait un rate-limit global)

/* ---------------------------
   🔐 Authentification
---------------------------- */

// Limiter uniquement /login
router.post("/login", loginLimiter, loginAdmin);

// Rafraîchir token (POST conseillé)
router.post("/refresh", refreshSession);

// Infos admin connecté
router.get("/me", requireRole("admin", "superadmin"), (req, res) => {
  // renvoyer le profil minimal
  res.json({ admin: { id: req.admin.id, email: req.admin.email, role: req.admin.role } });
});

router.get("/profile", requireRole("admin", "superadmin"), getAdminMe);

// Changer mot de passe (admin connecté)
router.put("/change-password", requireRole("admin", "superadmin"), changePassword);

// Mot de passe oublié / reset (public)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

/* ---------------------------
   👥 Gestion des administrateurs
---------------------------- */
router.get("/admins", requireRole("admin", "superadmin"), getAllAdmins);

router.post("/admins", requireRole("superadmin"), ajouterAdministrateur);

// Validation légère de l'ID (numérique)
router.delete("/admins/:id", requireRole("superadmin"), deleteAdmin);

/* ---------------------------
   🧨 Réinitialisation base (ultra-protégée)
---------------------------- */
router.delete("/reset", requireRole("superadmin"), async (_req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && process.env.ALLOW_DB_RESET !== "true") {
    return res.status(403).json({ error: "RESET_FORBIDDEN", message: "Réinitialisation désactivée en production." });
  }

  try {
    await pool.query("BEGIN");
    await pool.query("TRUNCATE TABLE candidatures, offres RESTART IDENTITY CASCADE");
    await pool.query("COMMIT");
    res.json({ message: "✅ Base de données réinitialisée." });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Erreur réinitialisation :", err.message);
    res.status(500).json({ error: "RESET_FAILED" });
  }
});

/* ---------------------------
   ✅ Vérification du token
---------------------------- */
router.get("/verify-token", requireRole("admin", "superadmin"), (req, res) => {
  res.json({ message: "Token valide ✅", admin: req.admin });
});

export default router;
