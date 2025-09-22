// scripts/create-admin.js

import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pkg from "pg";
import { pool } from "../config/db.js"

// Charger les variables d'environnement (.env)
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Informations à personnaliser
const email = "admin@cdotchad.com";
const motdepasse = "Dob123"; // Change ce mot de passe

const createAdmin = async () => {
  try {
    // Vérifier si un admin existe déjà
    const existing = await pool.query("SELECT * FROM administrateurs WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      console.log("⚠️ Cet email est déjà utilisé.");
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motdepasse, 10);

    // Insérer l'admin
    await pool.query(
      "INSERT INTO administrateurs (email, motdepasse) VALUES ($1, $2)",
      [email, hashedPassword]
    );

    console.log("✅ Administrateur créé avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors de la création :", err);
  } finally {
    await pool.end();
  }
};

createAdmin();
