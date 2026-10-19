// 📁 public_html/backend/config/db.js

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); // pas de path relatif pour éviter problème de CWD

const { Pool, types } = pkg;

// Les colonnes DATE (date de publication et date limite des offres) sont renvoyées telles
// qu'elles sont stockées, "AAAA-MM-JJ". Sans cela, pg les convertit en minuit heure du
// serveur puis en UTC : un visiteur situé dans un autre fuseau (le Tchad, en été) voyait
// la veille, et les formulaires de modification reculaient la date d'un jour à chaque
// enregistrement.
types.setTypeParser(1082, (valeur) => valeur);

const port = Number(process.env.DB_PORT) || 5432;
const user = process.env.DB_USER || "";
const host = process.env.DB_HOST || "";
const database = process.env.DB_NAME || "";
const password = process.env.DB_PASSWORD || "";
// DB_SSL permet de forcer explicitement true/false (utile si la base de prod est en local
// et refuse le SSL). Sans réglage, on garde le comportement historique : SSL en production.
const ssl =
  process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : process.env.DB_SSL === "false"
    ? false
    : process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false;

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
