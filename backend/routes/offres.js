// 📁 routes/offres.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
  getAllOffres,
  getOffreById,
  exportOffresPDF,
  ajouterOffre,
  modifierOffre,
  supprimerOffre,
} from "../controllers/offres.controller.js";

import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier réel: /backend/uploads/documents
const uploadDir = path.join(__dirname, "..", "uploads", "documents");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".pdf";
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    cb(null, `offre-${ts}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Format de document non autorisé."));
  }
};

const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Public
router.get("/", getAllOffres);
router.get("/export/pdf", exportOffresPDF);
router.get("/:id", getOffreById);

const offreFiles = documentUpload.fields([
  { name: "document", maxCount: 1 },
  { name: "fichier_joint", maxCount: 1 },
]);

// Admin
router.post(
  "/",
  requireRole("admin", "superadmin"),
  offreFiles,
  ajouterOffre
);

router.put(
  "/:id",
  requireRole("admin", "superadmin"),
  offreFiles,
  modifierOffre
);

router.delete("/:id", requireRole("admin", "superadmin"), supprimerOffre);

export default router;