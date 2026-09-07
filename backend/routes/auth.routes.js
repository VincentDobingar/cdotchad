// routes/auth.routes.js
import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
} from "../controllers/auth.controller.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

// Auth candidat (le login admin canonique vit sous /backend/admin/login)
router.post("/register", registerUser);
router.post("/login", loginUser);

// Session courante, tous rôles (utilisé par AuthContext au chargement de l'app)
router.get("/me", requireRole(), getMe);

// Refresh unique, tous rôles (lit le cookie HttpOnly "refreshToken")
router.post("/refresh", refreshToken);

// Logout (efface le cookie refresh)
router.post("/logout", logoutUser);

export default router;
