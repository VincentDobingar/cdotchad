// controllers/utilisateurs.controller.js
// Gestion des comptes candidats (table `users`, role='candidat').
import { pool } from '../config/db.js';
import bcrypt from "bcryptjs";

// Liste des handlers

const getUtilisateurs = async (_req, res) => {
  try {
    const sql = `
      SELECT id, nom, prenom, email, role, COALESCE(cree_le, NOW()) AS cree_le
      FROM users
      WHERE role = 'candidat'
      ORDER BY id DESC
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("getUtilisateurs:", err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

const getUtilisateurById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nom, prenom, email, role, COALESCE(cree_le, NOW()) AS cree_le FROM users WHERE id = $1 AND role = 'candidat'",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    console.error("getUtilisateurById:", err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

const ajouterUtilisateur = async (req, res) => {
  const { nom, prenom, email, motdepasse } = req.body;
  if (!email || !motdepasse) return res.status(400).json({ erreur: "email et motdepasse requis" });
  try {
    const hash = await bcrypt.hash(motdepasse, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (nom, prenom, email, password_hash, role, cree_le)
       VALUES ($1, $2, $3, $4, 'candidat', NOW())
       RETURNING id, nom, prenom, email, role, COALESCE(cree_le, NOW()) AS cree_le`,
      [nom || null, prenom || null, email.toLowerCase().trim(), hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ erreur: "Cet email existe déjà." });
    console.error("ajouterUtilisateur:", err);
    res.status(500).json({ erreur: "Erreur lors de l'ajout." });
  }
};

const modifierUtilisateur = async (req, res) => {
  const { nom, prenom, email } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET nom = COALESCE($1, nom),
           prenom = COALESCE($2, prenom),
           email = COALESCE($3, email)
       WHERE id = $4 AND role = 'candidat'
       RETURNING id, nom, prenom, email, role, COALESCE(cree_le, NOW()) AS cree_le`,
      [nom || null, prenom || null, email ? email.toLowerCase().trim() : null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    console.error("modifierUtilisateur:", err);
    res.status(500).json({ erreur: 'Erreur lors de la mise à jour' });
  }
};

const supprimerUtilisateur = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM users WHERE id = $1 AND role = 'candidat' RETURNING id",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error("supprimerUtilisateur:", err);
    res.status(500).json({ erreur: 'Erreur lors de la suppression' });
  }
};

const getProfilUtilisateur = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });

    const { rows } = await pool.query(
      'SELECT id, nom, prenom, email, role FROM users WHERE id = $1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(rows[0]);
  } catch (err) {
    console.error("getProfilUtilisateur:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const updateMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });

    const { nom, email } = req.body;
    const { rows } = await pool.query(
      `UPDATE users
       SET nom = COALESCE($1, nom),
           email = COALESCE($2, email)
       WHERE id = $3
       RETURNING id, nom, prenom, email, role, COALESCE(cree_le, NOW()) AS cree_le`,
      [nom || null, email ? email.toLowerCase().trim() : null, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(rows[0]);
  } catch (err) {
    console.error("updateMe:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const changeMyPassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    if (!oldPassword || !newPassword) return res.status(400).json({ message: "oldPassword et newPassword requis" });

    const { rows } = await pool.query("SELECT password_hash FROM users WHERE id=$1", [userId]);
    const u = rows[0];
    if (!u) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const ok = await bcrypt.compare(oldPassword, u.password_hash);
    if (!ok) return res.status(400).json({ message: "Mot de passe actuel invalide" });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, userId]);

    return res.json({ message: "Mot de passe changé" });
  } catch (err) {
    console.error("changeMyPassword error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Export explicite et clair
export {
  getUtilisateurs,
  getUtilisateurById,
  ajouterUtilisateur,
  modifierUtilisateur,
  supprimerUtilisateur,
  getProfilUtilisateur,
  updateMe,
  changeMyPassword
};
