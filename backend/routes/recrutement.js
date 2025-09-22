import express from 'express';
import { pool } from '../config/db.js';
import authAdmin from 'authAdmin.js';

const router = express.Router();

router.post("/api/candidatures", async (req, res) => {
  const { nom, email, message, offre_id, cv_path } = req.body;

  try {
    await pool.query(
      `INSERT INTO candidatures (nom, email, message, offre_id, cv_path)
       VALUES ($1, $2, $3, $4, $5)`,
      [nom, email, message, offre_id, cv_path]
    );
    res.status(201).json({ message: "Candidature envoyée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de l’enregistrement de la candidature :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post('/offre', authAdmin, async (req, res) => {
  // Logique pour ajouter une offre, réservé aux admins connectés
  res.status(200).json({ message: 'Offre ajoutée avec succès' });
});

export default router;
