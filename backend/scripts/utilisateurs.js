// 📁 backend/scripts/utilisateurs.js
// Retrouver un compte (table `users`) et, si besoin, lui donner un nouveau mot de passe.
//
// Usage (depuis backend/) :
//   node --env-file=.env scripts/utilisateurs.js                 -> liste tous les comptes
//   node --env-file=.env scripts/utilisateurs.js admin           -> filtre (e-mail, nom, prénom ou rôle)
//   node --env-file=.env scripts/utilisateurs.js --reset <email> <nouveau-mot-de-passe>
//
// Les mots de passe sont stockés chiffrés (bcrypt) : on ne peut pas les relire,
// seulement les remplacer.
import bcrypt from "../lib/bcryptAdapter.js";
import { pool } from "../config/db.js";

const args = process.argv.slice(2);

async function lister(filtre) {
  const { rows } = await pool.query(
    `SELECT id, email, nom, prenom, role, statut_compte, cree_le
       FROM users
      WHERE $1::text IS NULL
         OR email ILIKE '%' || $1 || '%' OR nom ILIKE '%' || $1 || '%'
         OR prenom ILIKE '%' || $1 || '%' OR role ILIKE $1
      ORDER BY CASE role WHEN 'superadmin' THEN 0 WHEN 'admin' THEN 1 WHEN 'partenaire' THEN 2 ELSE 3 END, id`,
    [filtre || null]
  );
  if (rows.length === 0) return console.log("Aucun compte trouvé.");
  console.table(
    rows.map((u) => ({
      id: u.id,
      email: u.email,
      nom: [u.prenom, u.nom].filter(Boolean).join(" "),
      role: u.role,
      statut: u.statut_compte,
      cree_le: u.cree_le ? new Date(u.cree_le).toLocaleDateString("fr-FR") : "",
    }))
  );
  console.log(`${rows.length} compte(s). Les administrateurs se connectent sur /admin/login, les autres sur /login.`);
}

async function reinitialiser(email, mdp) {
  if (!email || !mdp) throw new Error("Usage : --reset <email> <nouveau-mot-de-passe>");
  if (mdp.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  const hash = await bcrypt.hash(mdp, 10);
  const { rows } = await pool.query(
    `UPDATE users SET password_hash = $2, statut_compte = 'actif'
      WHERE lower(email) = lower($1) RETURNING id, email, role`,
    [email.trim(), hash]
  );
  if (!rows[0]) throw new Error(`Aucun compte avec l'adresse ${email}.`);
  console.log(`✅ Mot de passe remplacé pour ${rows[0].email} (rôle ${rows[0].role}).`);
}

try {
  if (args[0] === "--reset") await reinitialiser(args[1], args[2]);
  else await lister(args[0]);
} catch (err) {
  console.error("❌", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
