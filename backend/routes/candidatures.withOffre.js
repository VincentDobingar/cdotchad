import express from "express";
import pool from "../config/db";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, o.titre AS offre_titre, o.employeur, o.lieu, o.description AS offre_description
       FROM candidatures c
       JOIN offres o ON c.offre_id = o.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Candidature introuvable." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;