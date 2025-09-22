import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";
import { verifyAdminToken } from "../middlewares/authAdmin.js"; // 🔐 middleware

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Route protégée
router.get("/", verifyAdminToken, async (req, res) => {
  const filePath = path.join(__dirname, "../sql/cdotchad_export.sql");

  try {
    const sql = fs.readFileSync(filePath, "utf8");
    await pool.query(sql);
    res.json({ success: true, message: "Base importée avec succès !" });
  } catch (err) {
    console.error("Erreur d'import SQL:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
