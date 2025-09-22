// backend/controllers/recrutement.controller.js
import { pool } from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ✅ Nécessaire en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, "..", "uploads", "documents");

// 📁 Crée le dossier s’il n’existe pas
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log("📁 Dossier uploads/documents créé.");
}

// ✅ GET /api/recrutement/:id
export const getOffreById = async (req, res) => {
  const { id } = req.params;
  const offreId = parseInt(id);

  if (isNaN(offreId)) {
    return res.status(400).json({ error: "ID invalide." });
  }

  try {
    const result = await pool.query("SELECT * FROM offres WHERE id = $1", [offreId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Offre introuvable." });
    }

    const offre = result.rows[0];

    // Nettoyage / fallback sur les champs manquants
    const fullOffre = {
      id: offre.id,
      titre: offre.titre || "",
      resume: offre.resume || "",
      lieu: offre.lieu || "",
      type_contrat: offre.type_contrat?.trim() || "Non précisé",
      diplome: offre.diplome?.trim() || "Non précisé",
      langue: offre.langue || "",
      employeur: offre.employeur || "",
      description: offre.description || "",
      attributions: offre.attributions || "",
      competences: offre.competences || "",
      formation: offre.formation || "",
      experience: offre.experience || "",
      certifications: offre.certifications || "",
      logiciels: offre.logiciels || "",
      affiliations: offre.affiliations || "",
      date_publication: offre.date_publication,
      date_limite: offre.date_limite,
      document_url: offre.document_url || null
    };

    res.json(fullOffre);
  } catch (err) {
    console.error("❌ Erreur getOffreById :", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'offre." });
  }
};

// 📌 Ajouter une offre
export const ajouterOffre = async (req, res) => {
  try {
    const fields = req.body;

    if (!req.files) req.files = {};
    if (!req.files.document) req.files.document = [];
    if (!req.files.fichier_joint) req.files.fichier_joint = [];

    console.log("📨 Champs reçus :", fields);
    console.log("📂 Fichiers reçus :", Object.keys(req.files || {}));

    const documentFile = req.files?.document?.[0];
    const extraFile = req.files?.fichier_joint?.[0];

    let document_url = null;
    let autre_fichier_url = null;

    if (!documentFile) {
      console.warn("⚠️ Aucun fichier 'document' n'a été reçu.");
    } else {
      const ext = path.extname(documentFile.originalname);
      const filename = `offre_${Date.now()}${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.copyFileSync(documentFile.path, filepath);
      document_url = `${req.protocol}://${req.get("host")}/uploads/documents/${filename}`;
    }

    if (extraFile) {
      const ext = path.extname(extraFile.originalname);
      const filename = `piece_${Date.now()}${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.copyFileSync(extraFile.path, filepath);
      autre_fichier_url = `${req.protocol}://${req.get("host")}/uploads/documents/${filename}`;
    }

    const result = await pool.query(
      `INSERT INTO offres (
        titre, resume, description, lieu, type_contrat, employeur,
        diplome, experience, competences, langue, document_url,
        attributions, formation, certifications, logiciels, affiliations,
        date_publication, date_limite, autre_fichier_url, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, NOW(), NOW()
      ) RETURNING *`,
      [
        fields.titre,
        fields.resume,
        fields.description,
        fields.lieu,
        fields.type_contrat,
        fields.employeur,
        fields.diplome,
        fields.experience,
        fields.competences,
        fields.langue,
        document_url,
        fields.attributions,
        fields.formation,
        fields.certifications,
        fields.logiciels,
        fields.affiliations,
        fields.date_publication,
        fields.date_limite,
        autre_fichier_url
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de l'offre :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'ajout." });
  }
};




export const getToutesOffres = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM offres ORDER BY date_publication DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des offres :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// 📌 Modifier une offre
export const modifierOffre = async (req, res) => {
  const { id } = req.params;

  try {
    const fields = req.body;

    if (!req.files) req.files = {};
    if (!req.files.document) req.files.document = [];
    if (!req.files.fichier_joint) req.files.fichier_joint = [];

    const documentFile = req.files?.document?.[0];
    const extraFile = req.files?.fichier_joint?.[0];

    let document_url = null;
    let autre_fichier_url = null;

    // 🔍 Récupérer les anciennes URLs
    const { rows } = await pool.query("SELECT document_url, autre_fichier_url FROM offres WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    const oldOffre = rows[0];

    // 🧾 Traitement du document principal
    if (documentFile) {
      const ext = path.extname(documentFile.originalname);
      const filename = `offre_${Date.now()}${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.copyFileSync(documentFile.path, filepath);
      document_url = `${req.protocol}://${req.get("host")}/uploads/documents/${filename}`;

      // 🗑 Supprimer l'ancien
      if (oldOffre.document_url) {
        const oldFile = path.join(UPLOADS_DIR, path.basename(oldOffre.document_url));
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    } else {
      document_url = oldOffre.document_url;
    }

    // 🧾 Traitement du fichier joint
    if (extraFile) {
      const ext = path.extname(extraFile.originalname);
      const filename = `piece_${Date.now()}${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.copyFileSync(extraFile.path, filepath);
      autre_fichier_url = `${req.protocol}://${req.get("host")}/uploads/documents/${filename}`;

      // 🗑 Supprimer l'ancien
      if (oldOffre.autre_fichier_url) {
        const oldFile = path.join(UPLOADS_DIR, path.basename(oldOffre.autre_fichier_url));
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    } else {
      autre_fichier_url = oldOffre.autre_fichier_url;
    }

    // 🔄 Mise à jour en base
    const result = await pool.query(
      `UPDATE offres SET
        titre = $1, resume = $2, description = $3, lieu = $4,
        type_contrat = $5, employeur = $6, diplome = $7, experience = $8,
        competences = $9, langue = $10, document_url = $11, autre_fichier_url = $12,
        attributions = $13, formation = $14, certifications = $15, logiciels = $16,
        affiliations = $17, date_publication = $18, date_limite = $19,
        updated_at = NOW()
      WHERE id = $20
      RETURNING *`,
      [
        fields.titre,
        fields.resume,
        fields.description,
        fields.lieu,
        fields.type_contrat,
        fields.employeur,
        fields.diplome,
        fields.experience,
        fields.competences,
        fields.langue,
        document_url,
        autre_fichier_url,
        fields.attributions,
        fields.formation,
        fields.certifications,
        fields.logiciels,
        fields.affiliations,
        fields.date_publication,
        fields.date_limite,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erreur lors de la modification :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification." });
  }
};



// 📌 Supprimer une offre
export const supprimerOffre = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Récupérer l’ancien document_url
    const result = await pool.query("SELECT document_url FROM offres WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    const documentUrl = result.rows[0].document_url;

    // 2. Supprimer l'offre de la base
    await pool.query("DELETE FROM offres WHERE id = $1", [id]);

    // 3. Supprimer physiquement le fichier s'il existe
    if (documentUrl) {
      const filename = path.basename(documentUrl);
      const filePath = path.join(UPLOADS_DIR, filename);

      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.warn("⚠️ Erreur suppression fichier :", err.message);
          } else {
            console.log("🗑 Fichier supprimé avec succès :", filename);
          }
        });
      }
    }

    res.json({ message: "Offre et document supprimés avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'offre :", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
};



// 📌 Modifier une offre
export const updateOffre = async (req, res) => {
  const { id } = req.params;

  try {
    const fields = req.body;

    if (!req.files) req.files = {};
    if (!req.files.document) req.files.document = [];
    if (!req.files.fichier_joint) req.files.fichier_joint = [];

    const documentFile = req.files?.document?.[0];
    const extraFile = req.files?.fichier_joint?.[0];

    let document_url = null;
    let autre_fichier_url = null;

    // 🔍 Récupérer les anciennes URLs
    const { rows } = await pool.query("SELECT document_url, autre_fichier_url FROM offres WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    const oldOffre = rows[0];

    // 🧾 Traitement du document principal
    if (documentFile) {
      const ext = path.extname(documentFile.originalname);
      const filename = `offre_${Date.now()}${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.copyFileSync(documentFile.path, filepath);
      document_url = `${req.protocol}://${req.get("host")}/uploads/documents/${filename}`;

      // 🗑 Supprimer l'ancien
      if (oldOffre.document_url) {
        const oldFile = path.join(UPLOADS_DIR, path.basename(oldOffre.document_url));
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    } else {
      document_url = oldOffre.document_url;
    }

    // 🧾 Traitement du fichier joint
    if (extraFile) {
      const ext = path.extname(extraFile.originalname);
      const filename = `piece_${Date.now()}${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.copyFileSync(extraFile.path, filepath);
      autre_fichier_url = `${req.protocol}://${req.get("host")}/uploads/documents/${filename}`;

      // 🗑 Supprimer l'ancien
      if (oldOffre.autre_fichier_url) {
        const oldFile = path.join(UPLOADS_DIR, path.basename(oldOffre.autre_fichier_url));
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    } else {
      autre_fichier_url = oldOffre.autre_fichier_url;
    }

    // 🔄 Mise à jour en base
    const result = await pool.query(
      `UPDATE offres SET
        titre = $1, resume = $2, description = $3, lieu = $4,
        type_contrat = $5, employeur = $6, diplome = $7, experience = $8,
        competences = $9, langue = $10, document_url = $11, autre_fichier_url = $12,
        attributions = $13, formation = $14, certifications = $15, logiciels = $16,
        affiliations = $17, date_publication = $18, date_limite = $19,
        updated_at = NOW()
      WHERE id = $20
      RETURNING *`,
      [
        fields.titre,
        fields.resume,
        fields.description,
        fields.lieu,
        fields.type_contrat,
        fields.employeur,
        fields.diplome,
        fields.experience,
        fields.competences,
        fields.langue,
        document_url,
        autre_fichier_url,
        fields.attributions,
        fields.formation,
        fields.certifications,
        fields.logiciels,
        fields.affiliations,
        fields.date_publication,
        fields.date_limite,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Erreur lors de la modification :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification." });
  }
};


export const getAllOffres = async (req, res) => {
  const { page = 1, limit = 10, search = "", tri = "date_limite", ordre = "desc" } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const searchQuery = `%${search.toLowerCase()}%`;

  const champsTriValides = ["titre", "date_limite", "date_publication"];
  const ordreTri = ordre.toLowerCase() === "asc" ? "ASC" : "DESC";
  const colonneTri = champsTriValides.includes(tri) ? tri : "date_limite";

  try {
    const offresQuery = `
      SELECT * FROM offres
      WHERE LOWER(titre) LIKE $1 OR LOWER(lieu) LIKE $1
      ORDER BY ${colonneTri} ${ordreTri}
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) AS total FROM offres
      WHERE LOWER(titre) LIKE $1 OR LOWER(lieu) LIKE $1
    `;

    const [offresResult, countResult] = await Promise.all([
      pool.query(offresQuery, [searchQuery, limit, offset]),
      pool.query(countQuery, [searchQuery])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      offres: offresResult.rows,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    });
  } catch (err) {
    console.error("❌ Erreur getAllOffres :", err);
    res.status(500).json({ error: "Erreur lors de la récupération des offres." });
  }
};
