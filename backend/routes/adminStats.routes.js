import express from "express";
import { requireRole } from "../middlewares/requireRole.js";
import {
  getAdminStats,
  getCandidaturesParMois,
  getAdminStatsResume,
} from "../controllers/adminStatsController.js";

const router = express.Router();

// Sanity + auth
router.get("/health", requireRole("admin", "superadmin"), (req, res) => res.json({ ok: true, admin: req.admin }));

// Compteurs globaux
router.get("/", requireRole("admin", "superadmin"), getAdminStats);

// Candidatures par mois (?year=2025)
router.get("/candidatures-par-mois", requireRole("admin", "superadmin"), getCandidaturesParMois);

// Résumé complet (?year=2025&month=03)
router.get("/resume", requireRole("admin", "superadmin"), getAdminStatsResume);

export default router;
