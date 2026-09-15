// 📁 routes/candidatureRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireRole } from "../middlewares/requireRole.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import {
  getAllCandidatures,
  postCandidature,
  deleteCandidature,
  exportCandidaturesPDF,
  exportCandidaturesCSV,
  getCandidaturesStats,
  getMesCandidatures,
  updateStatutCandidature,
  envoyerEmailsCandidature
} from "../controllers/candidatures.controller.js";

const router = express.Router();

// Création dossiers upload si besoin
["cv", "lettres", "diplomes"].forEach((folder) => {
  const dir = `uploads/${folder}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ⚙️ Configuration Multer
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


// 📥 POSTULER : Ajout de candidature
router.post(
  "/",
  optionalAuth,
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "lettre", maxCount: 1 },
    { name: "diplome", maxCount: 1 },
  ]),
  postCandidature
);

// 📊 Statistiques
router.get("/stats", requireRole("admin", "superadmin"), getCandidaturesStats);

// 📩 Renvoi manuel des emails (optionnel)
router.post("/envoyer-mails", requireRole("admin", "superadmin"), envoyerEmailsCandidature);

// 🙋 Mes candidatures (candidat connecté)
router.get("/mes-candidatures", requireRole("candidat"), getMesCandidatures);

// 📄 Récupérer toutes les candidatures
router.get("/", requireRole("admin", "superadmin"), getAllCandidatures);

// 📤 Export PDF pour une offre donnée
router.get("/export/:offre_id", requireRole("admin", "superadmin"), exportCandidaturesPDF);

// 🧾 Export CSV global
router.get("/export-csv", requireRole("admin", "superadmin"), exportCandidaturesCSV);

// 🔄 Changer le statut d'une candidature
router.patch("/:id/statut", requireRole("admin", "superadmin"), updateStatutCandidature);

// 🗑️ Supprimer une candidature
router.delete("/:id", requireRole("admin", "superadmin"), deleteCandidature);

export default router;
