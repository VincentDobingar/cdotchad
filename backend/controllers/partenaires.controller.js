// 📁 backend/controllers/partenaires.controller.js
// Gestion des comptes partenaires par l'admin (création, réinitialisation, suppression).
// Un partenaire n'a pas d'inscription libre : son compte est créé ici, avec un mot de
// passe provisoire montré une seule fois à l'admin, qui le transmet au partenaire.
import crypto from "crypto";
import { pool } from "../config/db.js";
import bcrypt from "../lib/bcryptAdapter.js";

const nettoyer = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

const motDePasseProvisoire = () => crypto.randomBytes(9).toString("base64url");

const COLONNES_PARTENAIRE = `
  p.id, p.nom, p.contact_nom, p.telephone, p.secteur, p.ville, p.site_web, p.cree_le,
  u.id AS user_id, u.email, u.statut_compte`;

// 📋 Liste des partenaires, avec le nombre d'avis en attente de modération
export const listPartenaires = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLONNES_PARTENAIRE},
              (SELECT COUNT(*)::int FROM offres o
                WHERE o.partenaire_id = p.id AND o.statut_moderation = 'en_attente') AS avis_en_attente,
              (SELECT COUNT(*)::int FROM offres o WHERE o.partenaire_id = p.id) AS avis_total
       FROM partenaires p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.nom`
    );
    res.json({ partenaires: rows });
  } catch (err) {
    console.error("listPartenaires:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ➕ Création d'un partenaire et de son compte
export const creerPartenaire = async (req, res) => {
  const nom = nettoyer(req.body?.nom);
  const email = nettoyer(req.body?.email)?.toLowerCase();
  const champs = {
    contact_nom: nettoyer(req.body?.contact_nom),
    telephone: nettoyer(req.body?.telephone),
    secteur: nettoyer(req.body?.secteur),
    ville: nettoyer(req.body?.ville),
    site_web: nettoyer(req.body?.site_web),
  };

  if (!nom) return res.status(400).json({ message: "Le nom du partenaire est requis." });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Une adresse email valide est requise." });
  }

  const motdepasse = motDePasseProvisoire();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: existant } = await client.query("SELECT id FROM users WHERE lower(email) = $1", [email]);
    if (existant.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Cette adresse email est déjà utilisée." });
    }

    const { rows: userRows } = await client.query(
      `INSERT INTO users (nom, email, password_hash, role)
       VALUES ($1, $2, $3, 'partenaire') RETURNING id`,
      [nom, email, await bcrypt.hash(motdepasse, 10)]
    );
    const { rows } = await client.query(
      `INSERT INTO partenaires (user_id, nom, contact_nom, telephone, secteur, ville, site_web)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nom, contact_nom, telephone, secteur, ville, site_web, cree_le`,
      [userRows[0].id, nom, champs.contact_nom, champs.telephone, champs.secteur, champs.ville, champs.site_web]
    );
    await client.query("COMMIT");

    res.status(201).json({
      partenaire: { ...rows[0], user_id: userRows[0].id, email },
      motdepasse_provisoire: motdepasse,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("creerPartenaire:", err);
    res.status(500).json({ message: "Erreur lors de la création du partenaire." });
  } finally {
    client.release();
  }
};

// 🔑 Nouveau mot de passe provisoire pour un partenaire existant
export const reinitialiserMotDePasse = async (req, res) => {
  const motdepasse = motDePasseProvisoire();
  try {
    const { rows } = await pool.query(
      `UPDATE users SET password_hash = $1
       WHERE id = (SELECT user_id FROM partenaires WHERE id = $2) AND role = 'partenaire'
       RETURNING id`,
      [await bcrypt.hash(motdepasse, 10), req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Partenaire introuvable" });
    res.json({ motdepasse_provisoire: motdepasse });
  } catch (err) {
    console.error("reinitialiserMotDePasse:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🗑️ Suppression : supprime le compte ; les avis déjà soumis sont conservés (sans partenaire)
export const supprimerPartenaire = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM users
       WHERE id = (SELECT user_id FROM partenaires WHERE id = $1) AND role = 'partenaire'
       RETURNING id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Partenaire introuvable" });
    res.json({ message: "Partenaire supprimé" });
  } catch (err) {
    console.error("supprimerPartenaire:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
