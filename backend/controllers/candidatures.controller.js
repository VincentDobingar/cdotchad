import { pool } from "../config/db.js";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// 🔐 Récupérer toutes les candidatures (avec filtres)
export const getAllCandidatures = async (req, res) => {
  const { offre, date_min, date_max } = req.query;
  const conditions = [];
  const values = [];

  if (offre) {
    values.push(`%${offre.toLowerCase()}%`);
    conditions.push(`LOWER(o.titre) LIKE $${values.length}`);
  }

  if (date_min) {
    values.push(date_min);
    conditions.push(`c.date_candidature >= $${values.length}`);
  }

  if (date_max) {
    values.push(date_max);
    conditions.push(`c.date_candidature <= $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `SELECT c.id, c.nom, c.email, c.telephone, c.cv_path, c.lettre_path, c.diplome_path, c.date_candidature, o.titre AS titre_offre
       FROM candidatures c
       LEFT JOIN offres o ON c.offre_id = o.id
       ${whereClause}
       ORDER BY c.date_candidature DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur récupération candidatures :", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ✅ Ajouter une candidature
export const postCandidature = async (req, res) => {
  try {
    const { nom, email, telephone, lien, commentaire, offre_id } = req.body;
    const cv_path = req.files.cv[0].path;
    const lettre_path = req.files.lettre[0].path;
    const diplome_path = req.files.diplome[0].path;

    await pool.query(
      `INSERT INTO candidatures (nom, email, telephone, lien, commentaire, cv_path, lettre_path, diplome_path, offre_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [nom, email, telephone, lien, commentaire, cv_path, lettre_path, diplome_path, offre_id]
    );

    const offreResult = await pool.query("SELECT titre FROM offres WHERE id = $1", [offre_id]);
    const offreTitre = offreResult.rows[0]?.titre || "Offre inconnue";

    // ✅ Transporteur SMTP cohérent avec mail.cdotchad.com
    const transporter = nodemailer.createTransport({
      host: "mail.cdotchad.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🔔 Email à l'admin
    const mailToAdmin = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_ADMIN,
      subject: `Nouvelle candidature pour : ${offreTitre}`,
      html: `
        <h2>Nouvelle candidature reçue</h2>
        <p><strong>Nom :</strong> ${nom}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${telephone}</p>
        <p><strong>Poste :</strong> ${offreTitre}</p>
        <p><strong>Commentaire :</strong> ${commentaire || "-"}</p>
        <p><strong>CV :</strong> <a href="https://cdotchad.com/${cv_path}">Voir</a></p>
        <p><strong>Lettre :</strong> <a href="https://cdotchad.com/${lettre_path}">Voir</a></p>
        <p><strong>Diplôme :</strong> <a href="https://cdotchad.com/${diplome_path}">Voir</a></p>
      `,
    };

    // ✅ Email de confirmation au candidat
    const mailToCandidat = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Confirmation de votre candidature pour : ${offreTitre}`,
      html: `
        <p>Bonjour ${nom},</p>
        <p>Nous avons bien reçu votre candidature pour le poste de <strong>${offreTitre}</strong>.</p>
        <p>Merci de l'intérêt que vous portez à notre organisation.</p>
        <p>Bien cordialement,<br>L’équipe CDO Tchad</p>
      `,
    };

    await transporter.sendMail(mailToAdmin);
    await transporter.sendMail(mailToCandidat);

    res.status(201).json({ message: "Candidature enregistrée avec succès." });
  } catch (err) {
    console.error("Erreur lors de l'enregistrement :", err.message);
    res.status(500).json({ error: "Erreur serveur lors de la soumission de candidature." });
  }
};

// ✅ Supprimer une candidature
export const deleteCandidature = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM candidatures WHERE id = $1", [id]);
    res.status(200).json({ message: "Candidature supprimée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression" });
  }
};

// ✅ Exporter en PDF
export const exportCandidaturesPDF = async (req, res) => {
  const { offre_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.nom, c.email, c.telephone, c.commentaire, c.date_candidature, o.titre
       FROM candidatures c
       JOIN offres o ON c.offre_id = o.id
       WHERE c.offre_id = $1
       ORDER BY c.date_candidature DESC`,
      [offre_id]
    );

    const candidatures = result.rows;
    if (candidatures.length === 0) {
      return res.status(404).json({ error: "Aucune candidature trouvée pour cette offre." });
    }

    const offreTitre = candidatures[0].titre;
    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", `attachment; filename="candidatures_offre_${offre_id}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);
    doc.fontSize(18).text(`Candidatures pour : ${offreTitre}`, {
      align: "center",
      underline: true,
    });
    doc.moveDown();

    candidatures.forEach((c, i) => {
      doc
        .fontSize(12)
        .text(`Candidat ${i + 1}`, { underline: true })
        .text(`Nom        : ${c.nom}`)
        .text(`Email      : ${c.email}`)
        .text(`Téléphone  : ${c.telephone}`)
        .text(`Commentaire: ${c.commentaire || "-"}`)
        .text(`Date       : ${new Date(c.date_candidature).toLocaleString()}`)
        .moveDown();
    });

    doc.end();
  } catch (err) {
    console.error("Erreur génération PDF :", err);
    res.status(500).json({ error: "Erreur lors de la génération du PDF." });
  }
};

// ✅ Fonction 5 : Statistiques par mois et par offre
export const getCandidaturesStats = async (req, res) => {
  try {
    const statsParMois = await pool.query(`
      SELECT TO_CHAR(date_candidature, 'YYYY-MM') AS mois,
             COUNT(*) AS total
      FROM candidatures
      GROUP BY mois
      ORDER BY mois DESC
    `);

    const statsParOffre = await pool.query(`
      SELECT o.titre AS offre,
             COUNT(c.id) AS total
      FROM candidatures c
      JOIN offres o ON c.offre_id = o.id
      GROUP BY o.titre
      ORDER BY total DESC
    `);

    res.json({
      parMois: statsParMois.rows,
      parOffre: statsParOffre.rows,
    });
  } catch (err) {
    console.error("Erreur statistiques candidatures:", err);
    res.status(500).json({ error: "Erreur statistiques" });
  }
};

// ✅ Fonction 6 : Extraction des emails (utilisée dans postCandidature)
export const envoyerEmailsCandidature = async (candidat, offreTitre, fichiers) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT),
    secure: process.env.EMAIL_SMTP_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { nom, email, telephone, commentaire } = candidat;

  const mailToAdmin = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_ADMIN,
    subject: `Nouvelle candidature pour : ${offreTitre}`,
    html: `
      <h2>Nouvelle candidature</h2>
      <p><strong>Nom :</strong> ${nom}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Téléphone :</strong> ${telephone}</p>
      <p><strong>Commentaire :</strong> ${commentaire || '-'}</p>
      <p><strong>CV :</strong> <a href="https://cdotchad.com/${fichiers.cv}">Voir</a></p>
      <p><strong>Lettre :</strong> <a href="https://cdotchad.com/${fichiers.lettre}">Voir</a></p>
      <p><strong>Diplôme :</strong> <a href="https://cdotchad.com/${fichiers.diplome}">Voir</a></p>
    `,
  };

  const mailToCandidat = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Confirmation - ${offreTitre}`,
    html: `
      <p>Bonjour ${nom},</p>
      <p>Votre candidature pour le poste de <strong>${offreTitre}</strong> a bien été reçue.</p>
      <p>Merci pour votre intérêt.</p>
      <p>CDO Tchad</p>
    `,
  };

  await transporter.sendMail(mailToAdmin);
  await transporter.sendMail(mailToCandidat);
};

