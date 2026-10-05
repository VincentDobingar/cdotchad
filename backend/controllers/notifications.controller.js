// 📁 backend/controllers/notifications.controller.js
// Notifications dans l'application. Toutes les routes exigent un compte connecté :
// req.user.id est fiable. Un utilisateur ne voit que ses propres notifications.
import { pool } from "../config/db.js";

const LIMITE_PAR_DEFAUT = 50;

// Crée une notification pour un utilisateur. Ne bloque jamais le traitement appelant :
// en cas d'erreur, on journalise et on continue (la décision métier est déjà enregistrée).
export async function creerNotification(userId, type, message, lien = null) {
  if (!userId) return;
  try {
    await pool.query(
      "INSERT INTO notifications (user_id, type, message, lien) VALUES ($1, $2, $3, $4)",
      [userId, type, message, lien]
    );
  } catch (err) {
    console.error("Erreur création notification :", err);
  }
}

// GET /notifications : les plus récentes, avec le nombre de non lues
export const listMesNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, type, message, lien, lue, cree_le
       FROM notifications
       WHERE user_id = $1
       ORDER BY cree_le DESC, id DESC
       LIMIT $2`,
      [req.user.id, LIMITE_PAR_DEFAUT]
    );
    const { rows: compte } = await pool.query(
      "SELECT COUNT(*)::int AS non_lues FROM notifications WHERE user_id = $1 AND lue = false",
      [req.user.id]
    );
    res.json({ notifications: rows, non_lues: compte[0].non_lues });
  } catch (err) {
    console.error("Erreur liste notifications :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// PATCH /notifications/:id/lue
export const marquerLue = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE notifications SET lue = true WHERE id = $1 AND user_id = $2 RETURNING id, lue",
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Notification introuvable" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Erreur marquage notification :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// POST /notifications/tout-lire
export const marquerToutesLues = async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET lue = true WHERE user_id = $1 AND lue = false", [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erreur marquage notifications :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
