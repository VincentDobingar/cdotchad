import { Router } from "express";
import {
  getGalerie,
  getCategories,
  createImage,
  updateImage,
  deleteImage
} from "../controllers/galerie.controller.js";
import { uploadGalerie } from "../utils/upload.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = Router();

// Public
router.get("/", getGalerie);
router.get("/categories", getCategories);

// Admin protégées
router.post("/", requireRole("admin", "superadmin"), uploadGalerie.single("image"), createImage);
router.put("/:id", requireRole("admin", "superadmin"), uploadGalerie.single("image"), updateImage);
router.delete("/:id", requireRole("admin", "superadmin"), deleteImage);

export default router;
