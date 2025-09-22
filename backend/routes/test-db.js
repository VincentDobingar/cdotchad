import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); // ✅ charge .env

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const router = express.Router();

router.get("/", async (req, res) => {
  console.log("📥 GET /api/test-db"); // ← Ajoute ceci pour débogage
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Connexion PostgreSQL réussie ✅", time: result.rows[0].now });
  } catch (error) {
    console.error("❌ Erreur de connexion PostgreSQL :", error);
    res.status(500).json({ error: "Échec de connexion à PostgreSQL" });
  }
});

export default router;
