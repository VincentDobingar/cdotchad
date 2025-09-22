// 📁 routes/actualites.routes.js
import express from "express";
import { verifyAdminToken } from "../middlewares/verifyAdminToken.js";
import { uploadImageActu } from "../middlewares/uploadImage.js";
import {
  getActualitesStats,
  getActualites,
  getActualiteById,
  createActualite,
  updateActualite,
  deleteActualite,
  getAnneesActualites,
  getCategoriesActualites,
  getStatsParCategorie,
} from "../controllers/actualites.controller.js";
import { mustBeNumericId } from "../utils/mw.js";

const router = express.Router();

/**
 * IMPORTANT : placer les routes spécifiques AVANT les routes paramétrées (/:id)
 * pour éviter que "/annees" ou "/categories" soient captés par :id
 */

// 🔹 Stats
router.get("/stats", getActualitesStats);
router.get("/stats/categories", getStatsParCategorie);

// 🔹 Listes annexes
router.get("/annees", getAnneesActualites);
router.get("/categories", getCategoriesActualites);

// 🔹 Liste principale
router.get("/", getActualites);

// 🔹 CRUD (protégé)
router.post("/", verifyAdminToken, uploadImageActu.single("image"), createActualite);

// Option 1 : forcer un id numérique pour éviter les collisions de routes
router.get("/:id", mustBeNumericId, getActualiteById);
router.put("/:id", verifyAdminToken, uploadImageActu.single("image"), mustBeNumericId, updateActualite);
router.delete("/:id", verifyAdminToken, mustBeNumericId, deleteActualite);

// Si tu veux aussi un accès par slug plus tard :
// router.get("/slug/:slug", getActualiteBySlug);

export default router;
