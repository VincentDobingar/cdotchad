// 📁 utils/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

function ensureDir(abs) {
  if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
}

const MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function slugBase(name = "image") {
  // retire l'extension, normalise, garde des noms propres & courts
  const noExt = name.replace(/\.[^.]+$/, "");
  return noExt
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .toLowerCase();
}

function makeUploader(subdir, maxSizeMB = 5) {
  const ABS_DIR = path.join(process.cwd(), "uploads", subdir);
  ensureDir(ABS_DIR);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ABS_DIR),
    filename: (_req, file, cb) => {
      const extFromName = (path.extname(file.originalname) || "").toLowerCase();
      const extFromMime = MIME_EXT[file.mimetype] || extFromName || ".jpg";
      const base = slugBase(file.originalname || "image");
      cb(null, `${base}-${Date.now()}${extFromMime}`);
    },
  });

  const fileFilter = (_req, file, cb) => {
    const ok = !!MIME_EXT[file.mimetype];
    cb(ok ? null : new Error("Format d’image non supporté."), ok);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
}

export const uploadGalerie = makeUploader("galerie", 5);
export const uploadActualite = makeUploader("actualites", 6);
