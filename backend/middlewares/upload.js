// backend/middlewares/uploads.js
import multer from "multer";
import path from "path";
import fs from "fs";


const storage = multer.memoryStorage();


// 📁 Fonction utilitaire pour créer le dossier d’upload si besoin
function getUploadPath(type) {
  const uploadDir = `./uploads/${type}`;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Dossier ${uploadDir} créé`);
  }
  return uploadDir;
}

// 🎯 Crée un stockage multer adapté au type de fichier
function createStorage(type) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, getUploadPath(type));
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${file.fieldname}${ext}`;
      cb(null, filename);
    },
  });
}

// ✅ Middleware pour l’upload des CVs
export const uploadCV = multer({
  storage: createStorage("cv"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: function (req, file, cb) {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Seuls les fichiers PDF, DOC, DOCX sont autorisés"));
    }
    cb(null, true);
  },
});

// ✅ Middleware pour l’upload des documents d’offres (PDF/image)
export const uploadOffreFile = multer({
  storage: createStorage("documents"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: function (req, file, cb) {
    const allowed = [".pdf", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Seuls les fichiers PDF, PNG, JPG, JPEG sont autorisés"));
    }
    cb(null, true);
  },
});
