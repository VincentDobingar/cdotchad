// 📁 controllers/utilisateurs.controller.js
import { pool } from '../config/db.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// GET /backend/utilisateurs
export const getUtilisateurs = async (_req, res) => {
  try {
    const sql = `
      SELECT id, nom, email, role, COALESCE(cree_le, NOW()) AS cree_le
      FROM utilisateurs
      ORDER BY id DESC
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("getUtilisateurs:", err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// GET /backend/utilisateurs/:id
export const getUtilisateurById = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nom, email, role, COALESCE(cree_le, NOW()) AS cree_le FROM utilisateurs WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
};

// POST /backend/utilisateurs
export const ajouterUtilisateur = async (req, res) => {
  const { nom, email, motdepasse, role } = req.body;
  if (!email || !motdepasse) return res.status(400).json({ erreur: "email et motdepasse requis" });
  try {
    const hash = await bcrypt.hash(motdepasse, 10);
    const { rows } = await pool.query(
      `INSERT INTO utilisateurs (nom, email, motdepasse, role, cree_le)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, nom, email, role, COALESCE(cree_le, NOW()) AS cree_le`,
      [nom || null, email, hash, role || 'utilisateur']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ erreur: "Cet email existe déjà." });
    res.status(500).json({ erreur: "Erreur lors de l’ajout." });
  }
};

// PUT /backend/utilisateurs/:id
export const modifierUtilisateur = async (req, res) => {
  const { nom, email, role } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE utilisateurs
       SET nom = $1, email = $2, role = $3
       WHERE id = $4
       RETURNING id, nom, email, role, COALESCE(cree_le, NOW()) AS cree_le`,
      [nom || null, email, role, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ erreur: 'Erreur lors de la mise à jour' });
  }
};

// DELETE /backend/utilisateurs/:id
export const supprimerUtilisateur = async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM utilisateurs WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch {
    res.status(500).json({ erreur: 'Erreur lors de la suppression' });
  }
};

// GET /backend/utilisateurs/profil
export const getProfilUtilisateur = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nom, email, role FROM utilisateurs WHERE id = $1',
      [req.utilisateur.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(rows[0]);
  } catch (err) {
    console.error("getProfilUtilisateur:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /backend/utilisateurs/login
export const loginUtilisateur = async (req, res) => {
  const { email, motdepasse } = req.body;
  try {
    const { rows } = await pool.query("SELECT * FROM utilisateurs WHERE email = $1", [email]);
    const u = rows[0];
    if (!u) return res.status(401).json({ message: "Email incorrect" });
    const ok = await bcrypt.compare(motdepasse, u.motdepasse);
    if (!ok) return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, process.env.JWT_SECRET || "devsecret", { expiresIn: "3h" });
    res.json({ token, utilisateur: { id: u.id, nom: u.nom, email: u.email, role: u.role } });
  } catch {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
