// 📁 controllers/offres.controller.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { pool } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads", "documents");

function formatErrorForLog(error, req) {
  return {
    message: error?.message || null,
    code: error?.code || null,
    detail: error?.detail || null,
    constraint: error?.constraint || null,
    column: error?.column || null,
    table: error?.table || null,
    where: error?.where || null,
    stack: error?.stack || null,
    body: req?.body || null,
    file: req?.file
      ? {
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
        }
      : null,
  };
}

function removeFileIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Erreur suppression fichier:", err?.message || err);
  }
}

function buildEtatSql() {
  return `
    CASE
      WHEN LOWER(COALESCE(statut, '')) = 'brouillon' THEN 'Brouillon'
      WHEN LOWER(COALESCE(statut, '')) = 'suspendue' THEN 'Suspendue'
      WHEN LOWER(COALESCE(statut, '')) IN ('cloturee', 'clôturée') THEN 'Expirée'
      WHEN date_limite IS NOT NULL AND date_limite < CURRENT_DATE THEN 'Expirée'
      ELSE 'Active'
    END AS etat
  `;
}

function normalizeSort(sort) {
  const [fieldRaw, dirRaw] = String(sort || "date_publication:desc").split(":");
  const allowedFields = [
    "date_publication",
    "date_limite",
    "titre",
    "employeur",
    "lieu",
  ];

  const field = allowedFields.includes(fieldRaw) ? fieldRaw : "date_publication";
  const dir = String(dirRaw).toLowerCase() === "asc" ? "ASC" : "DESC";

  return { field, dir };
}

function safeTrim(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v === "" ? null : v;
}

function toOffrePayload(body = {}) {
  return {
    titre: safeTrim(body.titre),
    resume: safeTrim(body.resume),
    description: safeTrim(body.description),
    attributions: safeTrim(body.attributions),
    statut: safeTrim(body.statut) || "publiee",
    date_publication: safeTrim(body.date_publication),
    date_limite: safeTrim(body.date_limite),
    lieu: safeTrim(body.lieu),
    employeur: safeTrim(body.employeur),
    type_contrat: safeTrim(body.type_contrat),
    type_recrutement: safeTrim(body.type_recrutement) || "externe",
    diplome: safeTrim(body.diplome),
    formation: safeTrim(body.formation),
    experience: safeTrim(body.experience),
    certifications: safeTrim(body.certifications),
    logiciels: safeTrim(body.logiciels),
    affiliations: safeTrim(body.affiliations),
    competences: safeTrim(body.competences),
    langue: safeTrim(body.langue),
  };
}

function validateOffre(payload) {
  const errors = {};

  if (!payload.titre || payload.titre.length < 3) {
    errors.titre = "Le titre est requis (3 caractères minimum).";
  } else if (payload.titre.length > 255) {
    errors.titre = "Le titre ne doit pas dépasser 255 caractères.";
  }

  if (!payload.resume || payload.resume.length < 10) {
    errors.resume = "Le résumé doit contenir au moins 10 caractères.";
  }

  if (!payload.description || payload.description.length < 20) {
    errors.description = "La description doit contenir au moins 20 caractères.";
  }

  if (!payload.lieu) {
    errors.lieu = "Le lieu est requis.";
  }

  if (!payload.date_publication) {
    errors.date_publication = "La date de publication est requise.";
  }

  if (!payload.date_limite) {
    errors.date_limite = "La date d’expiration est requise.";
  }

  if (payload.date_publication && payload.date_limite) {
    if (new Date(payload.date_limite) < new Date(payload.date_publication)) {
      errors.date_limite =
        "La date limite doit être postérieure ou égale à la date de publication.";
    }
  }

  return errors;
}

export async function getAllOffres(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "6", 10), 1);
    const offset = (page - 1) * limit;

    const {
      search = "",
      lieu = "",
      employeur = "",
      type_contrat = "",
      type_recrutement = "",
      statut = "",
      date_min = "",
      date_max = "",
      sort = "date_publication:desc",
    } = req.query;

    const where = [];
    const values = [];

    const pushCondition = (sql, value) => {
      values.push(value);
      where.push(sql.replace("?", `$${values.length}`));
    };

    if (search) {
      values.push(`%${search}%`);
      const i = values.length;
      where.push(`(
        titre ILIKE $${i}
        OR employeur ILIKE $${i}
        OR lieu ILIKE $${i}
        OR resume ILIKE $${i}
        OR description ILIKE $${i}
        OR attributions ILIKE $${i}
        OR competences ILIKE $${i}
        OR formation ILIKE $${i}
        OR experience ILIKE $${i}
        OR certifications ILIKE $${i}
        OR logiciels ILIKE $${i}
        OR affiliations ILIKE $${i}
      )`);
    }

    if (lieu) pushCondition(`lieu ILIKE ?`, `%${lieu}%`);
    if (employeur) pushCondition(`employeur ILIKE ?`, `%${employeur}%`);
    if (type_contrat) pushCondition(`type_contrat ILIKE ?`, `%${type_contrat}%`);
    if (type_recrutement) {
      pushCondition(`LOWER(type_recrutement) = LOWER(?)`, type_recrutement);
    }
    if (statut) pushCondition(`LOWER(statut) = LOWER(?)`, statut);
    if (date_min) pushCondition(`date_publication >= ?`, date_min);
    if (date_max) pushCondition(`date_publication <= ?`, date_max);

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { field: sortField, dir: sortDir } = normalizeSort(sort);

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM offres
      ${whereClause}
    `;

    const dataQuery = `
      SELECT
        id,
        titre,
        resume,
        description,
        attributions,
        statut,
        date_publication,
        date_limite,
        lieu,
        employeur,
        type_contrat,
        type_recrutement,
        diplome,
        formation,
        experience,
        certifications,
        logiciels,
        affiliations,
        competences,
        langue,
        document_url,
        autre_fichier_url,
        ${buildEtatSql()}
      FROM offres
      ${whereClause}
      ORDER BY ${sortField} ${sortDir} NULLS LAST
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = countResult.rows[0]?.total || 0;

    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

    return res.json({
      offres: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Erreur getAllOffres:", error);
    return res.status(500).json({
      message: error?.message || "Erreur serveur",
      code: error?.code || null,
      detail: error?.detail || null,
    });
  }
}

export async function getOffreById(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        titre,
        resume,
        description,
        attributions,
        statut,
        date_publication,
        date_limite,
        lieu,
        employeur,
        type_contrat,
        type_recrutement,
        diplome,
        formation,
        experience,
        certifications,
        logiciels,
        affiliations,
        competences,
        langue,
        document_url,
        autre_fichier_url,
        ${buildEtatSql()}
      FROM offres
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Offre introuvable" });
    }

    return res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Erreur getOffreById:", error);
    return res.status(500).json({
      message: error?.message || "Erreur serveur",
      code: error?.code || null,
      detail: error?.detail || null,
    });
  }
}

export async function ajouterOffre(req, res) {
  try {
    const payload = toOffrePayload(req.body);
    const errors = validateOffre(payload);
    const documentFile = req.files?.document?.[0] || req.file || null;
    const extraFile = req.files?.fichier_joint?.[0] || null;

    if (Object.keys(errors).length > 0) {
      removeFileIfExists(documentFile?.path);
      removeFileIfExists(extraFile?.path);

      return res.status(400).json({
        message: "Validation échouée",
        errors,
      });
    }

    const document_url = documentFile?.filename || null;
    const autre_fichier_url = extraFile?.filename || null;

    const result = await pool.query(
      `
      INSERT INTO offres (
        titre,
        resume,
        description,
        attributions,
        statut,
        date_publication,
        date_limite,
        lieu,
        employeur,
        type_contrat,
        type_recrutement,
        diplome,
        formation,
        experience,
        certifications,
        logiciels,
        affiliations,
        competences,
        langue,
        document_url,
        autre_fichier_url
      )
      VALUES (
        $1,$2,$3,$4,$5,
        COALESCE($6::date, CURRENT_DATE),
        $7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING *
      `,
      [
        payload.titre,
        payload.resume,
        payload.description,
        payload.attributions,
        payload.statut,
        payload.date_publication || null,
        payload.date_limite || null,
        payload.lieu,
        payload.employeur,
        payload.type_contrat,
        payload.type_recrutement,
        payload.diplome,
        payload.formation,
        payload.experience,
        payload.certifications,
        payload.logiciels,
        payload.affiliations,
        payload.competences,
        payload.langue,
        document_url,
        autre_fichier_url,
      ]
    );

    return res.status(201).json({
      message: "Offre créée avec succès",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur ajouterOffre détaillée:", formatErrorForLog(error, req));

    return res.status(500).json({
      message: error?.message || "Erreur serveur",
      code: error?.code || null,
      detail: error?.detail || null,
    });
  }
}

export async function modifierOffre(req, res) {
  try {
    const { id } = req.params;
    const payload = toOffrePayload(req.body);
    const errors = validateOffre(payload);
    const documentFile = req.files?.document?.[0] || req.file || null;
    const extraFile = req.files?.fichier_joint?.[0] || null;

    if (Object.keys(errors).length > 0) {
      removeFileIfExists(documentFile?.path);
      removeFileIfExists(extraFile?.path);

      return res.status(400).json({
        message: "Validation échouée",
        errors,
      });
    }

    const current = await pool.query(
      "SELECT document_url, autre_fichier_url FROM offres WHERE id = $1",
      [id]
    );

    if (current.rows.length === 0) {
      removeFileIfExists(documentFile?.path);
      removeFileIfExists(extraFile?.path);

      return res.status(404).json({ message: "Offre introuvable" });
    }

    let document_url = current.rows[0].document_url;
    let autre_fichier_url = current.rows[0].autre_fichier_url;

    if (documentFile?.filename) {
      if (document_url) {
        removeFileIfExists(path.join(uploadsDir, document_url));
      }
      document_url = documentFile.filename;
    }

    if (extraFile?.filename) {
      if (autre_fichier_url) {
        removeFileIfExists(path.join(uploadsDir, autre_fichier_url));
      }
      autre_fichier_url = extraFile.filename;
    }

    const result = await pool.query(
      `
      UPDATE offres
      SET
        titre = $1,
        resume = $2,
        description = $3,
        attributions = $4,
        statut = $5,
        date_publication = COALESCE($6::date, date_publication),
        date_limite = $7,
        lieu = $8,
        employeur = $9,
        type_contrat = $10,
        type_recrutement = $11,
        diplome = $12,
        formation = $13,
        experience = $14,
        certifications = $15,
        logiciels = $16,
        affiliations = $17,
        competences = $18,
        langue = $19,
        document_url = $20,
        autre_fichier_url = $21,
        updated_at = NOW()
      WHERE id = $22
      RETURNING *
      `,
      [
        payload.titre,
        payload.resume,
        payload.description,
        payload.attributions,
        payload.statut,
        payload.date_publication || null,
        payload.date_limite || null,
        payload.lieu,
        payload.employeur,
        payload.type_contrat,
        payload.type_recrutement,
        payload.diplome,
        payload.formation,
        payload.experience,
        payload.certifications,
        payload.logiciels,
        payload.affiliations,
        payload.competences,
        payload.langue,
        document_url,
        autre_fichier_url,
        id,
      ]
    );

    return res.json({
      message: "Offre modifiée avec succès",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur modifierOffre détaillée:", formatErrorForLog(error, req));

    return res.status(500).json({
      message: error?.message || "Erreur serveur",
      code: error?.code || null,
      detail: error?.detail || null,
    });
  }
}

export async function supprimerOffre(req, res) {
  try {
    const { id } = req.params;

    const current = await pool.query(
      "SELECT document_url, autre_fichier_url FROM offres WHERE id = $1",
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: "Offre introuvable" });
    }

    const { document_url, autre_fichier_url } = current.rows[0];

    await pool.query("DELETE FROM offres WHERE id = $1", [id]);

    if (document_url) removeFileIfExists(path.join(uploadsDir, document_url));
    if (autre_fichier_url) removeFileIfExists(path.join(uploadsDir, autre_fichier_url));

    return res.json({ message: "Offre supprimée avec succès" });
  } catch (error) {
    console.error("Erreur supprimerOffre:", error);
    return res.status(500).json({
      message: error?.message || "Erreur serveur",
      code: error?.code || null,
      detail: error?.detail || null,
    });
  }
}

export async function exportOffresPDF(_req, res) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        titre,
        employeur,
        lieu,
        type_contrat,
        type_recrutement,
        statut,
        date_publication,
        date_limite
      FROM offres
      ORDER BY date_publication DESC NULLS LAST, id DESC
    `);

    const offres = result.rows || [];

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="offres-cdo.pdf"');

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    doc.pipe(res);

    doc.fontSize(18).text("Liste des offres - CDO Tchad", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Date d'export : ${new Date().toLocaleString("fr-FR")}`);
    doc.moveDown(1.5);

    if (offres.length === 0) {
      doc.fontSize(12).text("Aucune offre disponible.");
      doc.end();
      return;
    }

    offres.forEach((offre, index) => {
      doc
        .fontSize(13)
        .text(`${index + 1}. ${offre.titre || "Sans titre"}`, { underline: true });

      doc.moveDown(0.3);
      doc.fontSize(10);
      doc.text(`Employeur : ${offre.employeur || "-"}`);
      doc.text(`Lieu : ${offre.lieu || "-"}`);
      doc.text(`Type de contrat : ${offre.type_contrat || "-"}`);
      doc.text(`Type de recrutement : ${offre.type_recrutement || "-"}`);
      doc.text(`Statut : ${offre.statut || "-"}`);
      doc.text(
        `Publication : ${
          offre.date_publication
            ? new Date(offre.date_publication).toLocaleDateString("fr-FR")
            : "-"
        }`
      );
      doc.text(
        `Date limite : ${
          offre.date_limite
            ? new Date(offre.date_limite).toLocaleDateString("fr-FR")
            : "-"
        }`
      );

      doc.moveDown();

      if (doc.y > 730) {
        doc.addPage();
      }
    });

    doc.end();
  } catch (error) {
    console.error("Erreur exportOffresPDF:", error);
    return res.status(500).json({
      message: error?.message || "Erreur serveur",
      code: error?.code || null,
      detail: error?.detail || null,
    });
  }
}