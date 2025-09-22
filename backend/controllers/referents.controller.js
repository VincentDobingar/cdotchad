import { pool } from "../config/db.js";
import fs from "fs";
import path from "path";

// ✅ Obtenir tous les référents
export const getReferents = async (req, res) => {
  const result = await pool.query("SELECT * FROM referents ORDER BY nom ASC");
  res.json(result.rows);
};

// ✅ Ajouter un nouveau référent
export const createReferent = async (req, res) => {
  const { nom, resume, description } = req.body;
  const logo = req.file ? `/uploads/referents/${req.file.filename}` : null;

  await pool.query(
    `INSERT INTO referents (nom, resume, description, logo)
     VALUES ($1, $2, $3, $4)`,
    [nom, resume, description, logo]
  );

  res.status(201).json({ message: "Référent ajouté avec succès" });
};

// ✅ Supprimer un référent
export const deleteReferent = async (req, res) => {
  const { id } = req.params;

  // Supprimer aussi le fichier logo
  const result = await pool.query("SELECT logo FROM referents WHERE id = $1", [id]);
  const logoPath = result.rows[0]?.logo;
  if (logoPath && fs.existsSync("." + logoPath)) {
    fs.unlinkSync("." + logoPath);
  }

  await pool.query("DELETE FROM referents WHERE id = $1", [id]);
  res.status(204).send();
};
