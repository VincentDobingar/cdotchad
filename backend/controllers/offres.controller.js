import { pool } from "../config/db.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// 🔍 Récupérer toutes les offres avec filtres
export const getAllOffres = async (req, res) => {
  const {
    page = 1,
    limit = 5,
    search = "",
    tri = "date_limite",
    ordre = "desc",
    type_contrat,
    employeur,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const champsAutorisés = ["titre", "date_limite", "date_publication", "lieu"];
  const colonneTri = champsAutorisés.includes(tri) ? tri : "date_limite";
  const ordreTri = ordre.toLowerCase() === "asc" ? "ASC" : "DESC";

  let baseQuery = `SELECT * FROM offres WHERE 1=1`;
  let countQuery = `SELECT COUNT(*) FROM offres WHERE 1=1`;
  const values = [];
  let i = 1;

  if (search) {
    baseQuery += ` AND (LOWER(titre) LIKE $${i} OR LOWER(lieu) LIKE $${i})`;
    countQuery += ` AND (LOWER(titre) LIKE $${i} OR LOWER(lieu) LIKE $${i})`;
    values.push(`%${search.toLowerCase()}%`);
    i++;
  }

  if (type_contrat) {
    baseQuery += ` AND LOWER(type_contrat) = $${i}`;
    countQuery += ` AND LOWER(type_contrat) = $${i}`;
    values.push(type_contrat.toLowerCase());
    i++;
  }

  if (employeur) {
    baseQuery += ` AND LOWER(employeur) LIKE $${i}`;
    countQuery += ` AND LOWER(employeur) LIKE $${i}`;
    values.push(`%${employeur.toLowerCase()}%`);
    i++;
  }

  baseQuery += ` ORDER BY ${colonneTri} ${ordreTri} LIMIT $${i} OFFSET $${i + 1}`;
  values.push(limit, offset);

  try {
    const [result, countResult] = await Promise.all([
      pool.query(baseQuery, values),
      pool.query(countQuery, values.slice(0, i - 1)),
    ]);

    const now = new Date();
    const offresAvecEtat = result.rows.map((offre) => ({
      ...offre,
      etat: new Date(offre.date_limite) >= now ? "Actif" : "Expiré",
    }));

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      offres: offresAvecEtat,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
    });
  } catch (err) {
    console.error("Erreur récupération offres:", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des offres." });
  }
};

// 📄 Export PDF
export const exportOffresPDF = async (req, res) => {
  const { search = "", type_contrat, employeur } = req.query;

  let query = `SELECT * FROM offres WHERE 1=1`;
  const values = [];
  let i = 1;

  if (search) {
    query += ` AND (LOWER(titre) LIKE $${i} OR LOWER(lieu) LIKE $${i})`;
    values.push(`%${search.toLowerCase()}%`);
    i++;
  }

  if (type_contrat) {
    query += ` AND LOWER(type_contrat) = $${i}`;
    values.push(type_contrat.toLowerCase());
    i++;
  }

  if (employeur) {
    query += ` AND LOWER(employeur) LIKE $${i}`;
    values.push(`%${employeur.toLowerCase()}%`);
    i++;
  }

  query += ` ORDER BY date_limite DESC`;

  try {
    const result = await pool.query(query, values);
    const offres = result.rows;

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=offres.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Liste des Offres", { align: "center", underline: true });
    doc.moveDown();

    offres.forEach((offre, idx) => {
      doc.fontSize(12)
        .text(`Offre ${idx + 1}`, { underline: true })
        .text(`Titre       : ${offre.titre}`)
        .text(`Employeur   : ${offre.employeur}`)
        .text(`Lieu        : ${offre.lieu}`)
        .text(`Contrat     : ${offre.type_contrat}`)
        .text(`Publié le   : ${offre.date_publication || "N/A"}`)
        .text(`Date limite : ${offre.date_limite || "N/A"}`)
        .moveDown();
    });

    doc.end();
  } catch (err) {
    console.error("Erreur export PDF :", err);
    res.status(500).json({ error: "Erreur lors de l’export PDF." });
  }
};

// 🆔 Une seule offre
export const getOffreById = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM offres WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Offre non trouvée" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur récupération offre :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ➕ Ajouter une offre
export const ajouterOffre = async (req, res) => {
  const documentUrl = req.file?.filename || null;
  const {
    titre, resume, description, date_limite, lieu, type_contrat,
    employeur, diplome, experience, competences, langue,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO offres (
        titre, resume, description, date_limite, lieu, type_contrat,
        employeur, diplome, experience, competences, langue, document_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        titre, resume, description, date_limite, lieu, type_contrat,
        employeur, diplome, experience, competences, langue, documentUrl,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur création offre:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✏️ Modifier une offre
export const modifierOffre = async (req, res) => {
  const documentUrl = req.file?.filename || null;
  const {
    titre, resume, description, date_limite, lieu, type_contrat,
    employeur, diplome, experience, competences, langue,
  } = req.body;

  try {
    const existing = await pool.query("SELECT document_url FROM offres WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: "Offre non trouvée" });

    const oldDoc = existing.rows[0].document_url;
    if (documentUrl && oldDoc) {
      const oldPath = path.join("uploads", "documents", oldDoc);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const query = documentUrl
      ? `UPDATE offres SET
          titre=$1, resume=$2, description=$3, date_limite=$4, lieu=$5,
          type_contrat=$6, employeur=$7, diplome=$8, experience=$9,
          competences=$10, langue=$11, document_url=$12 WHERE id=$13 RETURNING *`
      : `UPDATE offres SET
          titre=$1, resume=$2, description=$3, date_limite=$4, lieu=$5,
          type_contrat=$6, employeur=$7, diplome=$8, experience=$9,
          competences=$10, langue=$11 WHERE id=$12 RETURNING *`;

    const values = documentUrl
      ? [titre, resume, description, date_limite, lieu, type_contrat, employeur, diplome, experience, competences, langue, documentUrl, req.params.id]
      : [titre, resume, description, date_limite, lieu, type_contrat, employeur, diplome, experience, competences, langue, req.params.id];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur modification offre:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ❌ Supprimer une offre
export const supprimerOffre = async (req, res) => {
  try {
    const result = await pool.query("SELECT document_url FROM offres WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Offre non trouvée" });

    const documentUrl = result.rows[0].document_url;
    await pool.query("DELETE FROM offres WHERE id = $1", [req.params.id]);

    if (documentUrl) {
      const filePath = path.join("uploads", "documents", documentUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: "Offre et fichier supprimés avec succès" });
  } catch (err) {
    console.error("Erreur suppression offre:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
