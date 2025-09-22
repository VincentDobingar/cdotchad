// 📁 routes/offres.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getAllOffres,
  getOffreById,
  exportOffresPDF,
  ajouterOffre,
  modifierOffre,
  supprimerOffre
} from "../controllers/offres.controller.js";
import { verifyAdminToken } from "../middlewares/auth.js";

const router = express.Router();

// Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/documents"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    cb(null, `offre-${ts}${ext}`);
  },
});
const documentUpload = multer({ storage });

// ✅ GET liste
router.get("/", getAllOffres);

// ✅ Export PDF (PLACER AVANT "/:id")
router.get("/export/pdf", exportOffresPDF);

// ✅ Détail
router.get("/:id", getOffreById);

// ✅ Admin
router.post("/", verifyAdminToken, documentUpload.single("document"), ajouterOffre);
router.put("/:id", verifyAdminToken, documentUpload.single("document"), modifierOffre);
router.delete("/:id", verifyAdminToken, supprimerOffre);

export default router;
