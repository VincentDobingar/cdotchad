// 📁 controllers/documents.controller.js
import { pool } from "../config/db.js";
import fs from "fs";
import path from "path";

// 🔹 GET tous les documents
export const getDocuments = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM documents ORDER BY date_upload DESC");
    const docs = result.rows.map((doc) => ({
      ...doc,
      url: doc.url || `${req.protocol}://${req.get("host")}/uploads/documents/${doc.filename}`,
    }));
    res.json(docs);
  } catch (err) {
    console.error("Erreur récupération documents:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🔹 POST Upload PDF
export const uploadDocument = async (req, res) => {
  try {
    const { titre, categorie } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Aucun fichier reçu." });

    const docUrl = `${req.protocol}://${req.get("host")}/uploads/documents/${file.filename}`;

    const result = await pool.query(
      "INSERT INTO documents (titre, categorie, filename, url, date_upload) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [titre, categorie, file.filename, docUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur upload document:", err);
    res.status(500).json({ message: "Erreur lors de l'enregistrement." });
  }
};

// 🔹 PUT Mise à jour document
export const updateDocument = async (req, res) => {
  const { id } = req.params;
  const { titre, categorie } = req.body;

  try {
    const result = await pool.query("SELECT * FROM documents WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Document non trouvé." });

    await pool.query(
      "UPDATE documents SET titre = $1, categorie = $2 WHERE id = $3",
      [titre || null, categorie || null, id]
    );

    res.json({ message: "Document mis à jour avec succès." });
  } catch (err) {
    console.error("Erreur mise à jour:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🔹 DELETE document
export const deleteDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT filename FROM documents WHERE id = $1", [id]);
    const doc = result.rows[0];

    if (!doc) return res.status(404).json({ message: "Document non trouvé." });

    const filePath = path.join("uploads/documents", path.basename(doc.filename));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query("DELETE FROM documents WHERE id = $1", [id]);

    res.json({ message: "Document supprimé." });
  } catch (err) {
    console.error("Erreur suppression:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
