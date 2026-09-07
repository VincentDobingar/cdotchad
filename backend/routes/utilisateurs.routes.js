// routes/utilisateurs.routes.js
import express from 'express';
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";               // <-- ajouté pour la route /register
import { pool } from "../config/db.js";
import { requireRole } from "../middlewares/requireRole.js";

import {
  getUtilisateurs,
  getUtilisateurById,
  ajouterUtilisateur,
  modifierUtilisateur,
  supprimerUtilisateur,
  getProfilUtilisateur,
  loginUtilisateur,
  updateMe
} from '../controllers/utilisateurs.controller.js';

const router = express.Router();

// Admin-protected routes
router.get('/', requireRole("admin", "superadmin"), getUtilisateurs);
router.get('/:id', requireRole("admin", "superadmin"), getUtilisateurById);
router.post('/', requireRole("admin", "superadmin"), ajouterUtilisateur);
router.put('/:id', requireRole("admin", "superadmin"), modifierUtilisateur);
router.delete('/:id', requireRole("admin", "superadmin"), supprimerUtilisateur);

// User-protected routes
router.put('/me', requireRole("candidat"), updateMe);
//router.put('/me/password', requireRole("candidat"), changeMyPassword);

// Public registration
router.post('/register', async (req, res) => {
  const { email, motdepasse, nom } = req.body;
  if (!email || !motdepasse) return res.status(400).json({ message: "Champs requis manquants." });

  try {
    const existing = await pool.query("SELECT id FROM users WHERE lower(email) = lower($1)", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) return res.status(400).json({ message: "Email déjà utilisé." });

    const hashed = await bcrypt.hash(motdepasse, 10);
    await pool.query(
      "INSERT INTO users (nom, email, password_hash, role) VALUES ($1, $2, $3, 'candidat')",
      [nom || null, email.toLowerCase().trim(), hashed]
    );
    res.status(201).json({ message: "Inscription réussie." });
  } catch (err) {
    console.error("Erreur d'inscription :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Login (use controller)
router.post('/login', loginUtilisateur);

// Protected profile
router.get("/profil", requireRole("candidat"), getProfilUtilisateur);

export default router;
