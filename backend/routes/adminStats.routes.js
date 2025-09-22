import express from "express";
import { verifyAdminToken } from "../middlewares/verifyAdminToken.js";
import {
  getAdminStats,
  getCandidaturesParMois,
  getAdminStatsResume,
} from "../controllers/adminStatsController.js";

const router = express.Router();

// Sanity + auth
router.get("/health", verifyAdminToken, (req, res) => res.json({ ok: true, admin: req.admin }));

// Compteurs globaux
router.get("/", verifyAdminToken, getAdminStats);

// Candidatures par mois (?year=2025)
router.get("/candidatures-par-mois", verifyAdminToken, getCandidaturesParMois);

// Résumé complet (?year=2025&month=03)
router.get("/resume", verifyAdminToken, getAdminStatsResume);

export default router;
