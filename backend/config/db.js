// 📁 public_html/backend/config/db.js

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); // pas de path relatif pour éviter problème de CWD

const { Pool } = pkg;

const port = Number(process.env.DB_PORT) || 5432;
const user = process.env.DB_USER || "";
const host = process.env.DB_HOST || "";
const database = process.env.DB_NAME || "";
const password = process.env.DB_PASSWORD || "";
const ssl = process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false;

if (!user || !host || !database) {
  console.error("⚠️ DB config missing. Vérifie DB_USER, DB_HOST, DB_NAME dans .env");
  // Ne pas throw ici si tu veux éviter crash immédiat, mais utile pour debug.
}

const pool = new Pool({
  user,
  host,
  database,
  password,
  port,
  ssl,
});

pool.on("error", (err) => {
  console.error("PG POOL ERROR (event):", err && err.message);
});

export { pool };
