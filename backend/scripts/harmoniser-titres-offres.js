// 📁 backend/scripts/harmoniser-titres-offres.js
// Harmonise les titres des offres déjà enregistrées (même règle que les nouvelles
// saisies : utils/titreOffre.js).
//
// Usage (depuis backend/) :
//   node --env-file=.env scripts/harmoniser-titres-offres.js              -> aperçu, rien n'est modifié
//   node --env-file=.env scripts/harmoniser-titres-offres.js --appliquer  -> enregistre les changements
import { pool } from "../config/db.js";
import { harmoniserTitre } from "../utils/titreOffre.js";

const appliquer = process.argv.includes("--appliquer");

try {
  const { rows } = await pool.query("SELECT id, titre FROM offres ORDER BY id");
  const changements = rows
    .map((o) => ({ id: o.id, avant: o.titre, apres: harmoniserTitre(o.titre) }))
    .filter((c) => c.avant !== c.apres);

  if (changements.length === 0) {
    console.log(`Les ${rows.length} titres sont déjà harmonisés.`);
  } else {
    console.table(changements);
    if (appliquer) {
      for (const c of changements) {
        await pool.query("UPDATE offres SET titre = $2 WHERE id = $1", [c.id, c.apres]);
      }
      console.log(`✅ ${changements.length} titre(s) mis à jour sur ${rows.length}.`);
    } else {
      console.log(`${changements.length} titre(s) seraient modifiés sur ${rows.length}.`);
      console.log("Aperçu seulement. Pour enregistrer : ajoutez --appliquer à la commande.");
    }
  }
} catch (err) {
  console.error("❌", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
