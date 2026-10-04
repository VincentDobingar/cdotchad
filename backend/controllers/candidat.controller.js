// 📁 backend/controllers/candidat.controller.js
// Espace candidat : profil personnel et documents enregistrés (CV, lettre, diplôme).
// Toutes les routes sont protégées par requireRole("candidat") : req.user.id est fiable.
import fs from "fs";
import path from "path";
import { pool } from "../config/db.js";
import { PRIVATE_ROOT } from "../middlewares/uploadDocumentCandidat.js";

export const TYPES_DOCUMENTS = ["cv", "lettre", "diplome"];

const LONGUEUR_MAX = { nom: 100, prenom: 100, telephone: 30, ville: 100, pays: 100, resume: 2000 };

const nettoyer = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

function lienValide(v) {
  if (!v) return true;
  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function lirePresentationProfil(userId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nom, u.prenom, u.email, u.role,
            p.telephone, p.ville, p.pays, p.lien_linkedin, p.lien_portfolio, p.resume
     FROM users u
     LEFT JOIN profils_candidats p ON p.user_id = u.id
     WHERE u.id = $1 AND u.role = 'candidat'`,
    [userId]
  );
  return rows[0] || null;
}

// 👤 Profil du candidat connecté
export const getMonProfil = async (req, res) => {
  try {
    const profil = await lirePresentationProfil(req.user.id);
    if (!profil) return res.status(404).json({ message: "Profil introuvable" });
    res.json({ profil });
  } catch (err) {
    console.error("getMonProfil:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✏️ Mise à jour du profil (identité sur users, coordonnées sur profils_candidats)
export const updateMonProfil = async (req, res) => {
  const userId = req.user.id;
  const body = req.body || {};

  // Un champ absent du corps garde sa valeur actuelle ; un champ envoyé vide l'efface.
  const actuel = (await lirePresentationProfil(userId)) || {};
  const CHAMPS = ["nom", "prenom", "telephone", "ville", "pays", "lien_linkedin", "lien_portfolio", "resume"];
  const valeurs = Object.fromEntries(
    CHAMPS.map((c) => [c, Object.hasOwn(body, c) ? nettoyer(body[c]) : actuel[c] ?? null])
  );

  for (const [champ, max] of Object.entries(LONGUEUR_MAX)) {
    if (valeurs[champ] && valeurs[champ].length > max) {
      return res.status(400).json({ message: `Le champ ${champ} dépasse ${max} caractères.` });
    }
  }
  if (!lienValide(valeurs.lien_linkedin) || !lienValide(valeurs.lien_portfolio)) {
    return res.status(400).json({ message: "Les liens doivent commencer par http:// ou https://." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE users SET nom = $1, prenom = $2 WHERE id = $3 AND role = 'candidat'",
      [valeurs.nom, valeurs.prenom, userId]
    );
    await client.query(
      `INSERT INTO profils_candidats (user_id, telephone, ville, pays, lien_linkedin, lien_portfolio, resume)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         telephone = EXCLUDED.telephone,
         ville = EXCLUDED.ville,
         pays = EXCLUDED.pays,
         lien_linkedin = EXCLUDED.lien_linkedin,
         lien_portfolio = EXCLUDED.lien_portfolio,
         resume = EXCLUDED.resume,
         maj_le = now()`,
      [userId, valeurs.telephone, valeurs.ville, valeurs.pays, valeurs.lien_linkedin, valeurs.lien_portfolio, valeurs.resume]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateMonProfil:", err);
    return res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  } finally {
    client.release();
  }

  const profil = await lirePresentationProfil(userId);
  res.json({ profil });
};

// 📄 Liste des documents enregistrés (sans chemin disque)
export const listMesDocuments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, type, nom_original, taille, cree_le
       FROM documents_candidats
       WHERE user_id = $1
       ORDER BY type, cree_le DESC`,
      [req.user.id]
    );
    res.json({ documents: rows });
  } catch (err) {
    console.error("listMesDocuments:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Vérifie la signature réelle du fichier (le nom et le MIME peuvent être falsifiés).
async function estUnPdf(cheminAbsolu) {
  const fh = await fs.promises.open(cheminAbsolu, "r");
  try {
    const tete = Buffer.alloc(5);
    await fh.read(tete, 0, 5, 0);
    return tete.toString("latin1") === "%PDF-";
  } finally {
    await fh.close();
  }
}

const supprimerFichier = (cheminAbsolu) =>
  fs.promises.unlink(cheminAbsolu).catch(() => {});

// ➕ Ajout d'un document : remplace le document précédent du même type (un seul actif par type)
export const ajouterMonDocument = async (req, res) => {
  const fichier = req.file;
  if (!fichier) return res.status(400).json({ message: "Aucun fichier reçu." });

  const type = req.body?.type;
  if (!TYPES_DOCUMENTS.includes(type)) {
    await supprimerFichier(fichier.path);
    return res.status(400).json({ message: "Type de document invalide." });
  }

  if (!(await estUnPdf(fichier.path))) {
    await supprimerFichier(fichier.path);
    return res.status(400).json({ message: "Le fichier n'est pas un PDF valide." });
  }

  const cheminRelatif = path.relative(PRIVATE_ROOT, fichier.path).split(path.sep).join("/");
  const client = await pool.connect();
  let anciens = [];
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "DELETE FROM documents_candidats WHERE user_id = $1 AND type = $2 RETURNING chemin",
      [req.user.id, type]
    );
    anciens = rows;
    await client.query(
      `INSERT INTO documents_candidats (user_id, type, chemin, nom_original, taille)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, type, cheminRelatif, fichier.originalname, fichier.size]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    await supprimerFichier(fichier.path);
    console.error("ajouterMonDocument:", err);
    return res.status(500).json({ message: "Erreur lors de l'enregistrement du document." });
  } finally {
    client.release();
  }

  for (const ancien of anciens) await supprimerFichier(path.join(PRIVATE_ROOT, ancien.chemin));

  res.status(201).json({
    document: { type, nom_original: fichier.originalname, taille: fichier.size, cree_le: new Date() },
  });
};

// Document enregistré d'un candidat pour un type donné (utilisé par la candidature).
export async function getDocumentEnregistre(userId, type) {
  const { rows } = await pool.query(
    `SELECT chemin, nom_original FROM documents_candidats
     WHERE user_id = $1 AND type = $2
     ORDER BY cree_le DESC LIMIT 1`,
    [userId, type]
  );
  const doc = rows[0];
  if (!doc) return null;
  return { absolu: path.join(PRIVATE_ROOT, doc.chemin), nom_original: doc.nom_original };
}

// ⬇️ Téléchargement : propriétaire uniquement
export const telechargerMonDocument = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT chemin, nom_original FROM documents_candidats WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    const doc = rows[0];
    if (!doc) return res.status(404).json({ message: "Document introuvable" });

    const absolu = path.join(PRIVATE_ROOT, doc.chemin);
    if (!absolu.startsWith(PRIVATE_ROOT)) return res.status(404).json({ message: "Document introuvable" });

    res.download(absolu, doc.nom_original || "document.pdf", (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: "Fichier introuvable sur le serveur" });
    });
  } catch (err) {
    console.error("telechargerMonDocument:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🗑️ Suppression : propriétaire uniquement
export const supprimerMonDocument = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM documents_candidats WHERE id = $1 AND user_id = $2 RETURNING chemin",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Document introuvable" });
    await supprimerFichier(path.join(PRIVATE_ROOT, rows[0].chemin));
    res.json({ message: "Document supprimé" });
  } catch (err) {
    console.error("supprimerMonDocument:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
