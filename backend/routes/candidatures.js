import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  getAllCandidatures,
  postCandidature,
  deleteCandidature,
  exportCandidaturesPDF,
} from "../controllers/candidatures.controller.js";

import { verifyAdminToken } from "../middlewares/auth.js";

const router = express.Router();

// ✅ Création des dossiers de stockage s'ils n'existent pas
["cv", "lettres", "diplomes"].forEach((folder) => {
  const dir = `uploads/${folder}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ✅ Configuration de multer pour les fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "cv") cb(null, "uploads/cv");
    else if (file.fieldname === "lettre") cb(null, "uploads/lettres");
    else if (file.fieldname === "diplome") cb(null, "uploads/diplomes");
    else cb(new Error("Champ de fichier inconnu"), false);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/* ===========================
   ✅ ROUTES avec contrôleur
============================= */

// 🔹 GET - Toutes les candidatures (admin)
router.get("/", verifyAdminToken, getAllCandidatures);

// 🔹 POST - Soumettre une candidature
router.post(
  "/",
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "lettre", maxCount: 1 },
    { name: "diplome", maxCount: 1 },
  ]),
  postCandidature
);

// 🔹 DELETE - Supprimer une candidature
router.delete("/:id", verifyAdminToken, deleteCandidature);

// 🔹 GET - Export PDF candidatures d’une offre
router.get("/export/:offre_id", exportCandidaturesPDF);

export default router;
