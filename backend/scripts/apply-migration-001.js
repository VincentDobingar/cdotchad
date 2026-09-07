// 📁 backend/scripts/apply-migration-001.js
//
// Applique backend/sql/migrations/001_users_unifies.sql sur la base configurée
// dans backend/.env (les mêmes DB_HOST/DB_USER/... que le serveur utilise).
//
// Avant d'écrire quoi que ce soit :
//   1. Vérifie que `users` n'existe pas déjà (si si, la migration est idempotente
//      et se contentera de ne rien dupliquer, mais on te prévient quand même).
//   2. Sauvegarde les lignes actuelles de `administrateurs` et `utilisateurs`
//      dans backend/sql/backups/ (JSON, horodaté) — un filet de sécurité rapide,
//      en plus (pas à la place) d'une vraie sauvegarde pg_dump côté serveur.
//   3. Exécute la migration dans une transaction.
//   4. Affiche un résumé des comptes migrés par rôle.
//
// Usage (depuis le dossier backend/) :
//   node scripts/apply-migration-001.js
//
// Rien n'est écrit si une erreur survient : la transaction est annulée (ROLLBACK).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_FILE = path.join(__dirname, "../sql/migrations/001_users_unifies.sql");
const BACKUP_DIR = path.join(__dirname, "../sql/backups");

async function backupTable(client, table) {
  const { rows } = await client.query(`SELECT * FROM ${table}`);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(BACKUP_DIR, `${table}_${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), "utf8");
  console.log(`  ✔ ${table} (${rows.length} lignes) → ${path.relative(process.cwd(), file)}`);
}

async function main() {
  const client = await pool.connect();
  try {
    console.log("1) Vérification de l'état actuel de la base…");
    const { rows: exists } = await client.query("SELECT to_regclass('public.users') AS reg");
    if (exists[0].reg) {
      console.log("   ⚠ La table `users` existe déjà — la migration est idempotente,");
      console.log("     elle ne dupliquera rien, mais vérifie que c'est bien voulu.");
    } else {
      console.log("   OK, `users` n'existe pas encore.");
    }

    console.log("\n2) Sauvegarde rapide de administrateurs / utilisateurs…");
    await backupTable(client, "administrateurs");
    await backupTable(client, "utilisateurs");

    console.log("\n3) Application de la migration 001_users_unifies.sql…");
    const sql = fs.readFileSync(MIGRATION_FILE, "utf8");
    await client.query(sql); // le fichier contient déjà son propre BEGIN/COMMIT
    console.log("   ✔ Migration appliquée.");

    console.log("\n4) Résumé des comptes dans `users` :");
    const { rows: counts } = await client.query(
      "SELECT role, count(*) AS total FROM users GROUP BY role ORDER BY role"
    );
    console.table(counts);

    console.log("\nTerminé. Redémarre le backend (Passenger) pour qu'il prenne en compte `users`.");
  } catch (err) {
    console.error("\n❌ Erreur pendant la migration — rien n'a été laissé en état incohérent");
    console.error("   grâce au BEGIN/COMMIT du fichier SQL, mais vérifie le message ci-dessous :");
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
