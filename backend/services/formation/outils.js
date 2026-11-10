// 📁 backend/services/formation/outils.js
// Petites briques communes : journal des accès, e-mails, contrôles de droits.
import { pool } from "../../config/db.js";
import { transporter } from "../email.service.js";
import { FORMATION, erreur } from "./config.js";

/** Journalise une action (lecture, téléchargement, entrée en salle...). Ne bloque jamais. */
export async function journaliser(req, action, objetType, objetId) {
  try {
    await pool.query(
      `INSERT INTO formation_journal (user_id, action, objet_type, objet_id, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user?.id ?? null, action, objetType, objetId ?? null, req.ip || null, String(req.headers["user-agent"] || "").slice(0, 300)]
    );
  } catch (err) {
    console.error("Journal formation :", err.message);
  }
}

const echapper = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** E-mail simple aux couleurs du site. N'interrompt jamais le traitement en cas d'échec. */
export async function envoyerEmail({ to, sujet, titre, paragraphes = [], lien, libelleLien, piecesJointes }) {
  if (!to) return false;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1b1410">
      <div style="border-top:4px solid #c8102e;padding:24px 0 8px"><strong style="font-size:18px">${echapper(titre)}</strong></div>
      ${paragraphes.map((p) => `<p style="line-height:1.5">${echapper(p)}</p>`).join("")}
      ${lien ? `<p><a href="${echapper(lien)}" style="display:inline-block;background:#c8102e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${echapper(libelleLien || "Ouvrir")}</a></p>` : ""}
      <p style="color:#4a423c;font-size:12px;margin-top:32px">CDO Consulting Tchad — ${echapper(FORMATION.siteUrl.replace(/^https?:\/\//, ""))}</p>
    </div>`;
  try {
    await transporter.sendMail({
      from: `"CDO TCHAD" <${process.env.EMAIL_USER}>`,
      to,
      subject: sujet,
      html,
      attachments: piecesJointes,
    });
    return true;
  } catch (err) {
    console.error("E-mail formation :", err.message);
    return false;
  }
}

export const entierPositif = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export function idParam(req, nom = "id") {
  const n = entierPositif(req.params[nom]);
  if (!n) throw erreur(400, "Identifiant invalide.");
  return n;
}

export const texte = (v, max = 5000) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  return s.slice(0, max);
};

export const booleen = (v) => (v === undefined ? undefined : v === true || v === "true" || v === "1" || v === 1 || v === "on");

/**
 * Inscription validée de l'utilisateur à la session de l'objet demandé.
 * On répond 404 (et non 403) quand l'accès est refusé : le client du site déconnecte
 * l'utilisateur sur un 403.
 */
export async function inscriptionValidee(userId, sessionId) {
  const { rows } = await pool.query(
    "SELECT * FROM formation_inscriptions WHERE user_id = $1 AND session_id = $2 AND statut = 'validee'",
    [userId, sessionId]
  );
  if (!rows[0]) throw erreur(404, "Contenu réservé aux participants inscrits à cette session.");
  return rows[0];
}

export function slugifier(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "formation";
}
