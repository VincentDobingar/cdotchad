// 📁 backend/middlewares/comptePartenaire.js
// Vérifie, à chaque requête de l'espace partenaire, l'état réel du compte en base :
// un compte suspendu perd l'accès immédiatement (même avec un jeton encore valide),
// et un mot de passe provisoire doit être changé avant toute action.
import { pool } from "../config/db.js";

export async function verifierComptePartenaire(req, res, next) {
  try {
    const { rows } = await pool.query(
      "SELECT statut_compte, doit_changer_mdp FROM users WHERE id = $1 AND role = 'partenaire'",
      [req.user.id]
    );
    const compte = rows[0];
    if (!compte) return res.status(403).json({ message: "Compte introuvable.", code: "COMPTE_INTROUVABLE" });
    if (compte.statut_compte !== "actif") {
      return res.status(403).json({
        message: "Ce compte est suspendu. Contactez l'administration.",
        code: "COMPTE_SUSPENDU",
      });
    }
    // 423 (et non 401/403) : le frontend ne doit pas déconnecter le partenaire, seulement le rediriger.
    if (compte.doit_changer_mdp) {
      return res.status(423).json({
        message: "Changez votre mot de passe provisoire avant de continuer.",
        code: "MDP_A_CHANGER",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}
