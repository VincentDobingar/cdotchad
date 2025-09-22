import express from 'express';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import { pool } from "../config/db.js";
import { verifyAdminToken } from "../middlewares/verifyAdminToken.js";
import { verifyUserToken } from "../middlewares/verifyUserToken.js";
import {
  getUtilisateurs,
  getUtilisateurById,
  ajouterUtilisateur,
  modifierUtilisateur,
  supprimerUtilisateur,
  getProfilUtilisateur,
} from '../controllers/utilisateurs.controller.js';

const router = express.Router();

// ✅ Routes sécurisées pour admin
router.get('/', verifyAdminToken, getUtilisateurs);
router.get('/:id', verifyAdminToken, getUtilisateurById);
router.post('/', verifyAdminToken, ajouterUtilisateur);
router.put('/:id', verifyAdminToken, modifierUtilisateur);
router.delete('/:id', verifyAdminToken, supprimerUtilisateur);

// ✅ Profil utilisateur connecté
router.get("/profil", verifyUserToken, getProfilUtilisateur);

// ✅ Connexion utilisateur
router.post("/login", async (req, res) => {
  const { email, motdepasse } = req.body;
  try {
    const result = await pool.query("SELECT * FROM utilisateurs WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Email incorrect" });
    }

    const utilisateur = result.rows[0];
    const isMatch = await bcrypt.compare(motdepasse, utilisateur.motdepasse);

    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      {
        userId: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role || "user"
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role
      }
    });
  } catch (err) {
    console.error("Erreur login utilisateur :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ✅ Inscription utilisateur publique
router.post("/register", async (req, res) => {
  const { email, motdepasse } = req.body;

  if (!email || !motdepasse) {
    return res.status(400).json({ message: "Champs requis manquants." });
  }

  try {
    const existing = await pool.query("SELECT * FROM utilisateurs WHERE email = $1", [email]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé." });
    }

    const hashed = await bcrypt.hash(motdepasse, 10);
    await pool.query(
      "INSERT INTO utilisateurs (email, motdepasse) VALUES ($1, $2)",
      [email, hashed]
    );

    res.status(201).json({ message: "Inscription réussie." });
  } catch (err) {
    console.error("Erreur d'inscription :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
