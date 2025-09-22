// 📁 routes/documents.routes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  getDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documents.controller.js";

import { verifyAdminToken } from "../middlewares/auth.js";

const router = express.Router();

// 📁 Configuration de stockage pour les documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/documents";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = "doc-" + Date.now() + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

// 🔹 Récupérer tous les documents
router.get("/", getDocuments);

// 🔹 Upload document PDF (admin uniquement)
router.post("/upload", verifyAdminToken, upload.single("document"), uploadDocument);

// 🔹 Modifier document (titre/catégorie)
router.put("/:id", verifyAdminToken, updateDocument);

// 🔹 Supprimer un document
router.delete("/:id", verifyAdminToken, deleteDocument);

export default router;
