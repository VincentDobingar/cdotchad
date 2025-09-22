import multer from "multer";
import path from "path";
import fs from "fs";

const UP_DIR = path.join(process.cwd(), "uploads", "actualites");
if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .toLowerCase().replace(/[^a-z0-9-_]+/g, "-").slice(0, 50);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new Error("FORMAT_IMAGE_INVALIDE"), ok);
};

export const uploadActualite = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
