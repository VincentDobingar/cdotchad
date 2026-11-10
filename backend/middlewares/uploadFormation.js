// 📁 backend/middlewares/uploadFormation.js
// Dépôts de la plateforme de formation (supports, replays, devoirs) : fichier écrit dans
// un dossier temporaire privé, puis rangé par le contrôleur dans le stockage privé.
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { DOSSIER_TEMP } from "../services/formation/stockage.service.js";
import { FORMATION } from "../services/formation/config.js";

const stockageTemp = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOSSIER_TEMP),
  filename: (_req, _file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`),
});

const FORMATS = {
  support: [".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx", ".odp", ".odt", ".zip", ".png", ".jpg", ".jpeg"],
  replay: [".mp4", ".m4v", ".webm"],
  devoir: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg"],
};

function fabrique(type, maxMo) {
  const upload = multer({
    storage: stockageTemp,
    limits: { fileSize: maxMo * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ok = FORMATS[type].includes(path.extname(file.originalname || "").toLowerCase());
      cb(ok ? null : new Error(`Format non accepté. Formats autorisés : ${FORMATS[type].join(", ")}`), ok);
    },
  }).single("fichier");

  // Les erreurs multer (taille, format) deviennent des 400 lisibles par le frontend
  return (req, res, next) =>
    upload(req, res, (err) => {
      if (!err) return next();
      const message = err.code === "LIMIT_FILE_SIZE" ? `Fichier trop volumineux (${maxMo} Mo maximum).` : err.message;
      res.status(400).json({ message });
    });
}

export const uploadSupport = fabrique("support", FORMATION.stockage.supportMaxMo);
export const uploadReplay = fabrique("replay", FORMATION.stockage.replayMaxMo);
export const uploadDevoir = fabrique("devoir", FORMATION.stockage.devoirMaxMo);
