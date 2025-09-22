import { Router } from "express";
import {
  getGalerie,
  getCategories,
  createImage,
  updateImage,
  deleteImage
} from "../controllers/galerie.controller.js";
import { uploadGalerie } from "../utils/upload.js";
// Si tu protèges : import { verifyAdminToken } from "../middlewares/verifyAdminToken.js";

const router = Router();

// Public
router.get("/", getGalerie);
router.get("/categories", getCategories);

// Admin protégées (décommente verifyAdminToken si tu l’utilises)
// router.post("/", verifyAdminToken, uploadGalerie.single("image"), createImage);
// router.put("/:id", verifyAdminToken, uploadGalerie.single("image"), updateImage);
// router.delete("/:id", verifyAdminToken, deleteImage);

// Non protégées (à enlever en prod, c’est juste pour que tu testes vite)
router.post("/", uploadGalerie.single("image"), createImage);
router.put("/:id", uploadGalerie.single("image"), updateImage);
router.delete("/:id", deleteImage);

export default router;
