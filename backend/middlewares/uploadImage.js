import multer from "multer";
import path from "path";
import fs from "fs";

// Créer dossier uploads/actualites s’il n’existe pas
const dir = "uploads/actualites";
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e4);
    cb(null, `actu-${unique}${ext}`);
  },
});

export const uploadImageActu = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 Mo max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});
