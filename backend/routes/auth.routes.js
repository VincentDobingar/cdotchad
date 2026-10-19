// routes/auth.routes.js
import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { requireRole } from "../middlewares/requireRole.js";
import { rateLimit } from "express-rate-limit";

const router = express.Router();

// Limite les tentatives de connexion et d'inscription (force brute, création de comptes en masse).
// Valeurs tolérantes pour les IP partagées (cybercafés) tout en bloquant l'automatisation.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "TOO_MANY_LOGIN_ATTEMPTS", code: 429 }, // clé par défaut = IP (IPv6-safe)
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "TOO_MANY_SIGNUPS", code: 429 }, // clé par défaut = IP (IPv6-safe)
});

// Auth candidat (le login admin canonique vit sous /backend/admin/login)
router.post("/register", registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);

// Mot de passe oublié (candidat & partenaire) — public
router.post("/forgot-password", loginLimiter, forgotPassword);
router.post("/reset-password/:token", loginLimiter, resetPassword);

// Session courante, tous rôles (utilisé par AuthContext au chargement de l'app)
router.get("/me", requireRole(), getMe);

// Refresh unique, tous rôles (lit le cookie HttpOnly "refreshToken")
router.post("/refresh", refreshToken);

// Logout (efface le cookie refresh)
router.post("/logout", logoutUser);

export default router;
