// 📁 backend/middlewares/uploadLogoPartenaire.js
// Logo d'un partenaire : image PNG, JPEG ou WebP, 2 Mo maximum.
// Stocké dans uploads/logos_partenaires (public), colonne partenaires.logo_url.
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DOSSIER_LOGOS = path.join(__dirname, "..", "uploads", "logos_partenaires");

const EXTENSIONS = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(DOSSIER_LOGOS, { recursive: true });
    cb(null, DOSSIER_LOGOS);
  },
  filename: (_req, file, cb) => {
    const ext = EXTENSIONS[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = Object.keys(EXTENSIONS).includes(file.mimetype);
    cb(ok ? null : new Error("Le logo doit être une image PNG, JPEG ou WebP."), ok);
  },
}).single("logo");

// Reçoit le fichier et transforme les erreurs multer en 400 lisibles.
export function recevoirLogo(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Logo trop volumineux (2 Mo maximum)." : err.message;
      return res.status(400).json({ message, errors: { logo: message } });
    }
    next();
  });
}

export const supprimerLogo = (nomFichier) => {
  if (!nomFichier) return;
  fs.promises.unlink(path.join(DOSSIER_LOGOS, nomFichier)).catch(() => {});
};
