// 📁 routes/messages.routes.js
import express from "express";
import { pool } from "../config/db.js";
import { verifyAdminToken } from "../middlewares/verifyAdminToken.js";

const router = express.Router();

// ✅ GET tous les messages (protégé)
router.get("/", verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM messages_contact ORDER BY date_envoi DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur récupération messages:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// ✅ DELETE un message (protégé)
router.delete("/:id", verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM messages_contact WHERE id = $1", [id]);
    res.json({ message: "Message supprimé." });
  } catch (err) {
    console.error("Erreur suppression message:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});


export default router;
