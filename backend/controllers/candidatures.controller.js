import { pool } from "../config/db.js";
import nodemailer from "nodemailer";
import { transporter } from "../services/email.service.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Parser } from "json2csv";
import { getDocumentEnregistre } from "./candidat.controller.js";
import { creerNotification, notifierAdmins } from "./notifications.controller.js";

const STATUTS_VALIDES = ["recue", "en_cours", "entretien", "acceptee", "refusee"];
const LIBELLES_STATUT = {
  recue: "reçue",
  en_cours: "en cours d'examen",
  entretien: "entretien",
  acceptee: "acceptée",
  refusee: "non retenue",
};

dotenv.config();

// Génère un code de suivi unique (format CDO-XXXXXXXX), en réessayant en cas de collision.
async function genererCodeSuivi() {
  const { randomBytes } = await import("crypto");
  for (let essai = 0; essai < 6; essai++) {
    const code = "CDO-" + randomBytes(5).toString("hex").toUpperCase().slice(0, 8);
    const { rows } = await pool.query("SELECT 1 FROM candidatures WHERE code_suivi = $1 LIMIT 1", [code]);
    if (!rows.length) return code;
  }
  // Dernier recours : suffixe horodaté (extrêmement improbable d'arriver ici).
  return "CDO-" + Date.now().toString(36).toUpperCase();
}

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
      `SELECT c.id, c.nom, c.email, c.telephone, c.cv_path, c.lettre_path, c.diplome_path, c.statut, c.date_candidature, o.titre AS titre_offre
       FROM candidatures c
       LEFT JOIN offres o ON c.offre_id = o.id
       ${whereClause}
       ORDER BY c.date_candidature DESC`,
      values
    );
    res.json({ candidatures: result.rows, totalPages: 1 });
  } catch (err) {
    console.error("Erreur récupération candidatures :", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// 📋 Candidatures du candidat connecté
export const getMesCandidatures = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.statut, c.date_candidature, c.code_suivi, o.titre AS titre_offre
       FROM candidatures c
       LEFT JOIN offres o ON c.offre_id = o.id
       WHERE c.user_id = $1
       ORDER BY c.date_candidature DESC`,
      [req.user.id]
    );
    res.json({ candidatures: result.rows });
  } catch (err) {
    console.error("Erreur récupération de mes candidatures :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔄 Changer le statut d'une candidature (admin)
export const updateStatutCandidature = async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  if (!STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" });
  }

  try {
    const result = await pool.query(
      "UPDATE candidatures SET statut = $1 WHERE id = $2 RETURNING id, statut, user_id",
      [statut, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidature introuvable" });
    }
    const { user_id, ...candidature } = result.rows[0];
    // Candidature envoyée sans compte : personne à prévenir dans l'application
    if (user_id) {
      await creerNotification(
        user_id,
        "statut_candidature",
        `Le statut de votre candidature a changé : ${LIBELLES_STATUT[statut]}.`,
        "/mes-candidatures"
      );
    }
    res.json(candidature);
  } catch (err) {
    console.error("Erreur mise à jour statut candidature :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Dossiers publics des pièces de candidature (les mêmes que ceux de candidatureRoutes.js)
const DOSSIER_PIECES = { cv: "uploads/cv", lettre: "uploads/lettres", diplome: "uploads/diplomes" };

// Pour chaque pièce : le fichier joint à la candidature, sinon le document enregistré
// dans le profil du candidat connecté (copié dans le dossier public des candidatures).
async function resoudrePieces(fichiersRecus, userId) {
  const pieces = {};
  const manquantes = [];
  for (const type of Object.keys(DOSSIER_PIECES)) {
    const envoye = fichiersRecus?.[type]?.[0];
    if (envoye) {
      pieces[type] = envoye.path;
      continue;
    }
    const enregistre = userId ? await getDocumentEnregistre(userId, type) : null;
    if (!enregistre) {
      manquantes.push(type);
      continue;
    }
    const destination = path.join(DOSSIER_PIECES[type], `${Date.now()}-${type}.pdf`);
    await fs.promises.copyFile(enregistre.absolu, destination);
    pieces[type] = destination;
  }
  return { pieces, manquantes };
}

// ✅ Ajouter une candidature
export const postCandidature = async (req, res) => {
  try {
    const { nom, email, telephone, lien, commentaire, offre_id } = req.body;
    const userId = req.user?.role === "candidat" ? req.user.id : null;

    const { pieces, manquantes } = await resoudrePieces(req.files, userId);
    if (manquantes.length > 0) {
      return res.status(400).json({ error: `Pièce(s) manquante(s) : ${manquantes.join(", ")}.` });
    }
    const { cv: cv_path, lettre: lettre_path, diplome: diplome_path } = pieces;

    const codeSuivi = await genererCodeSuivi();

    await pool.query(
      `INSERT INTO candidatures (nom, email, telephone, lien, commentaire, cv_path, lettre_path, diplome_path, offre_id, user_id, code_suivi)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [nom, email, telephone, lien, commentaire, cv_path, lettre_path, diplome_path, offre_id, userId, codeSuivi]
    );

    const offreResult = await pool.query("SELECT titre FROM offres WHERE id = $1", [offre_id]);
    const offreTitre = offreResult.rows[0]?.titre || "Offre inconnue";

    await notifierAdmins(
      "nouvelle_candidature",
      `Nouvelle candidature de ${nom} pour « ${offreTitre} ».`,
      "/admin/candidatures"
    );

    // La candidature est enregistrée : on répond tout de suite avec le code de suivi.
    // L'envoi d'e-mail (ci-dessous) ne doit JAMAIS faire échouer la soumission : si la
    // configuration SMTP est indisponible, la candidature reste valide et le candidat a
    // son code de suivi à l'écran.
    res.status(201).json({ message: "Candidature enregistrée avec succès.", code_suivi: codeSuivi });

    const base = process.env.PUBLIC_BASE_URL || process.env.BASE_URL || "https://www.cdotchad.com";
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
        <p><strong>Code de suivi :</strong> ${codeSuivi}</p>
        <p><strong>Commentaire :</strong> ${commentaire || "-"}</p>
        <p><strong>CV :</strong> <a href="${base}/${cv_path}">Voir</a></p>
        <p><strong>Lettre :</strong> <a href="${base}/${lettre_path}">Voir</a></p>
        <p><strong>Diplôme :</strong> <a href="${base}/${diplome_path}">Voir</a></p>
      `,
    };

    const mailToCandidat = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Confirmation de votre candidature pour : ${offreTitre}`,
      html: `
        <p>Bonjour ${nom},</p>
        <p>Nous avons bien reçu votre candidature pour le poste de <strong>${offreTitre}</strong>.</p>
        <p>Votre code de suivi est : <strong>${codeSuivi}</strong></p>
        <p>Vous pouvez suivre l'avancement de votre candidature, sans vous connecter, à l'adresse :
           <a href="${base}/suivi">${base}/suivi</a> (en saisissant ce code).</p>
        <p>Merci de l'intérêt que vous portez à notre organisation.</p>
        <p>Bien cordialement,<br>L’équipe CDO Tchad</p>
      `,
    };

    try {
      await transporter.sendMail(mailToAdmin);
      await transporter.sendMail(mailToCandidat);
    } catch (mailErr) {
      // On n'échoue pas la candidature pour un problème d'e-mail : on journalise seulement.
      console.error("⚠️ Envoi e-mail candidature échoué (candidature tout de même enregistrée) :", mailErr?.message || mailErr);
    }
    return;
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

// 🧾 Export CSV global (admin)
export const exportCandidaturesCSV = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.nom, c.email, c.telephone, c.statut, c.date_candidature, o.titre AS offre
      FROM candidatures c
      LEFT JOIN offres o ON c.offre_id = o.id
      ORDER BY c.date_candidature DESC
    `);

    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.header("Content-Type", "text/csv");
    res.attachment("candidatures.csv");
    res.send(csv);
  } catch (err) {
    console.error("Erreur export candidatures:", err.message);
    res.status(500).json({ error: "Erreur exportation CSV" });
  }
};


// 🔎 Détail d'une candidature du candidat connecté (#2)
export const getMaCandidature = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.id, c.nom, c.email, c.telephone, c.lien, c.commentaire,
              c.cv_path, c.lettre_path, c.diplome_path, c.statut, c.code_suivi, c.date_candidature,
              o.id AS offre_id, o.titre AS titre_offre, o.lieu, o.employeur
       FROM candidatures c
       LEFT JOIN offres o ON c.offre_id = o.id
       WHERE c.id = $1 AND c.user_id = $2
       LIMIT 1`,
      [id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Candidature introuvable" });
    res.json({ candidature: result.rows[0] });
  } catch (err) {
    console.error("Erreur détail candidature :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🌐 Suivi public d'une candidature par code de suivi (#15), sans authentification.
// Ne renvoie que des informations non nominatives (statut, intitulé du poste, date).
export const getSuiviParCode = async (req, res) => {
  try {
    const code = String(req.params.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Code requis" });
    const result = await pool.query(
      `SELECT c.statut, c.date_candidature, o.titre AS titre_offre
       FROM candidatures c
       LEFT JOIN offres o ON c.offre_id = o.id
       WHERE UPPER(c.code_suivi) = $1
       LIMIT 1`,
      [code]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Aucune candidature ne correspond à ce code." });
    }
    res.json({ suivi: result.rows[0] });
  } catch (err) {
    console.error("Erreur suivi par code :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
