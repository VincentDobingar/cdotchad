// 📁 backend/scripts/apply-migrations.js
//
// Applique dans l'ordre les fichiers backend/sql/migrations/NNN_*.sql qui ne sont
// pas encore passés, sur la base désignée par les variables d'environnement
// DB_USER / DB_PASSWORD / DB_HOST / DB_PORT / DB_NAME / DB_SSL (indépendant du
// .env du projet : à lancer avec ces variables positionnées pour la commande,
// jamais écrites dans un fichier versionné).
//
// Chaque migration est idempotente (IF NOT EXISTS / WHERE NOT EXISTS), donc
// rejouer celles déjà appliquées ne fait rien. On les exécute quand même toutes
// dans l'ordre, chacune dans sa propre transaction (les fichiers contiennent déjà
// BEGIN/COMMIT) ; on s'arrête à la première erreur.
//
// Usage (depuis backend/) :
//   DB_USER=... DB_PASSWORD=... DB_HOST=... DB_PORT=... DB_NAME=... node scripts/apply-migrations.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "../sql/migrations");

const files = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => /^\d{3}_.*\.sql$/.test(f))
  .sort();

const ssl =
  process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : process.env.DB_SSL === "false"
    ? false
    : false;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  ssl,
});

async function main() {
  const client = await pool.connect();
  try {
    const { rows: who } = await client.query("SELECT current_database() AS db, current_user AS usr");
    console.log(`Connecté à ${who[0].db} en tant que ${who[0].usr}.\n`);

    console.log("Tables existantes avant migration :");
    const { rows: before } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log("  " + before.map((r) => r.table_name).join(", "));

    for (const file of files) {
      console.log(`\n→ ${file}`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      try {
        await client.query(sql);
        console.log("  ✔ OK");
      } catch (err) {
        console.error(`  ❌ Échec sur ${file} : ${err.message}`);
        process.exitCode = 1;
        return;
      }
    }

    console.log("\nTables existantes après migration :");
    const { rows: after } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log("  " + after.map((r) => r.table_name).join(", "));

    console.log("\nColonnes de users :");
    const { rows: userCols } = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
    );
    console.table(userCols);

    console.log("\nToutes les migrations ont été appliquées avec succès.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erreur fatale :", err.message);
  process.exitCode = 1;
});
