import express from "express";
import multer from "multer";
import path from "path";
import { verifyAdminToken } from "../middlewares/auth.js";
import {
  getReferents,
  createReferent,
  deleteReferent,
} from "../controllers/referents.controller.js";

const router = express.Router();

// ✅ Configuration de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/referents/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `logo-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Routes
router.get("/", getReferents);
router.post("/", verifyAdminToken, upload.single("logo"), createReferent);
router.delete("/:id", verifyAdminToken, deleteReferent);

export default router;
