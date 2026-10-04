// 📁 backend/middlewares/uploadDocumentCandidat.js
// Upload des documents privés d'un candidat (CV, lettre, diplôme).
// Stockage hors du dossier statique : backend/uploads_prives/candidats/<userId>/.
// Le type de fichier réel (signature %PDF) est vérifié dans le contrôleur.
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PRIVATE_ROOT = path.join(__dirname, "..", "uploads_prives");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(PRIVATE_ROOT, "candidats", String(req.user.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, _file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.pdf`);
  },
});

export const uploadDocumentCandidat = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = path.extname(file.originalname).toLowerCase() === ".pdf" && file.mimetype === "application/pdf";
    cb(ok ? null : new Error("Seul le format PDF est accepté."), ok);
  },
}).single("fichier");
