// backend/routes/admin.routes.js
import express from "express";
import { verifyUserToken, verifyAdminToken } from "../middlewares/auth.js";
import { getAllAdmins, deleteAdmin } from "../controllers/adminController.js";
import { pool } from "../config/db.js";

const router = express.Router();

// ✅ Réinitialiser toute la base (offres + candidatures)
router.delete("/reset", verifyAdminToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM candidatures");
    await pool.query("DELETE FROM offres");
    res.json({ message: "Base de données réinitialisée." });
  } catch (err) {
    console.error("Erreur suppression :", err.message);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

router.get("/", verifyAdminToken, getAllAdmins); // GET /api/admins/
router.delete("/:id", verifyAdminToken, deleteAdmin); // DELETE /api/admins/:id

export default router;
