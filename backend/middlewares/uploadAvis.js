// 📁 backend/middlewares/uploadAvis.js
// Pièce jointe optionnelle d'un avis de recrutement : un PDF, 10 Mo maximum.
// Stockée comme les offres admin (uploads/documents, colonne offres.document_url).
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DOSSIER_DOCUMENTS = path.join(__dirname, "..", "uploads", "documents");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(DOSSIER_DOCUMENTS, { recursive: true });
    cb(null, DOSSIER_DOCUMENTS);
  },
  filename: (_req, _file, cb) => {
    cb(null, `avis-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.pdf`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = path.extname(file.originalname).toLowerCase() === ".pdf" && file.mimetype === "application/pdf";
    cb(ok ? null : new Error("Seul le format PDF est accepté pour la pièce jointe."), ok);
  },
}).single("document");

// Reçoit le fichier (optionnel) et transforme les erreurs multer en 400 lisibles.
export function recevoirPieceJointe(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Pièce jointe trop volumineuse (10 Mo maximum)." : err.message;
      return res.status(400).json({ message, errors: { document: message } });
    }
    next();
  });
}

// Vérifie la signature %PDF- (le nom et le MIME peuvent être falsifiés).
export async function verifierPdf(req, res, next) {
  const fichier = req.file;
  if (!fichier) return next();
  try {
    const fh = await fs.promises.open(fichier.path, "r");
    const tete = Buffer.alloc(5);
    await fh.read(tete, 0, 5, 0);
    await fh.close();
    if (tete.toString("latin1") !== "%PDF-") throw new Error("non-pdf");
    next();
  } catch {
    await fs.promises.unlink(fichier.path).catch(() => {});
    return res.status(400).json({
      message: "Le fichier joint n'est pas un PDF valide.",
      errors: { document: "Le fichier joint n'est pas un PDF valide." },
    });
  }
}

export const supprimerFichierAvis = (nomFichier) => {
  if (!nomFichier) return;
  fs.promises.unlink(path.join(DOSSIER_DOCUMENTS, nomFichier)).catch(() => {});
};
