// 📁 routes/candidatureRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Parser } from "json2csv";
import { verifyAdminToken } from "../middlewares/auth.js";
import {
  getAllCandidatures,
  postCandidature,
  deleteCandidature,
  exportCandidaturesPDF,
  getCandidaturesStats,
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
  upload.fields([
    { name: "cv", maxCount: 1 },
    { name: "lettre", maxCount: 1 },
    { name: "diplome", maxCount: 1 },
  ]),
  postCandidature
);

// 📊 Statistiques
router.get("/stats", verifyAdminToken, getCandidaturesStats);

// 📩 Renvoi manuel des emails (optionnel)
router.post("/envoyer-mails", verifyAdminToken, envoyerEmailsCandidature);

// 📄 Récupérer toutes les candidatures
router.get("/", verifyAdminToken, getAllCandidatures);

// 📤 Export PDF pour une offre donnée
router.get("/export/:offre_id", verifyAdminToken, exportCandidaturesPDF);

// 🧾 Export CSV global
router.get("/export", verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.nom, c.email, c.telephone, c.date_postulation, o.titre AS offre
      FROM candidatures c
      JOIN offres o ON c.offre_id = o.id
    `);

    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.header("Content-Type", "text/csv");
    res.attachment("candidatures.csv");
    res.send(csv);
  } catch (err) {
    console.error("Erreur export candidatures:", err.message);
    res.status(500).json({ error: "Erreur exportation CSV" });
  }
});

// 🗑️ Supprimer une candidature
router.delete("/:id", verifyAdminToken, deleteCandidature);

export default router;
