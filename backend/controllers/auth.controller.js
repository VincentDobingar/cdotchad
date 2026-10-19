// controllers/auth.controller.js
// Authentification candidat (inscription/connexion) + refresh token unique,
// tous rôles confondus, contre la table `users`.
import jwt from "jsonwebtoken";
import bcrypt from "../lib/bcryptAdapter.js";
import { pool } from "../config/db.js";
import crypto from "crypto";
import { transporter } from "../services/email.service.js";

const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || "7d";
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.BASE_URL || "https://www.cdotchad.com";
const RESET_TOKEN_TTL_MIN = 30;
const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    // Le site est servi en HTTPS : cookie Secure par défaut, désactivé seulement en dev local.
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/backend/auth",
  });
}

// ---------- Register candidat ----------
export async function registerUser(req, res) {
  try {
    const { nom, prenom, email } = req.body;
    // Le frontend de connexion envoie "motdepasse" : on accepte aussi l'ancien nom "password".
    const motdepasse = req.body.motdepasse ?? req.body.password;
    if (!email || !motdepasse) return res.status(400).json({ message: "Champs requis manquants." });
    if (String(motdepasse).length < 8) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [email.toLowerCase().trim()]
    );
    if (existing.length > 0) return res.status(409).json({ message: "Email déjà utilisé." });

    const hash = await bcrypt.hash(motdepasse, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (nom, prenom, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'candidat') RETURNING id, nom, prenom, email, role`,
      [nom?.trim() || null, prenom?.trim() || null, email.toLowerCase().trim(), hash]
    );
    const user = rows[0];

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({ accessToken, utilisateur: user });
  } catch (err) {
    console.error("registerUser error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

// ---------- Login candidat ----------
export async function loginUser(req, res) {
  try {
    const { email, motdepasse } = req.body;
    if (!email || !motdepasse) return res.status(400).json({ message: "Champs requis manquants." });

    // Comptes candidat et partenaire (les admins ont leur propre connexion, /admin/login)
    const { rows } = await pool.query(
      `SELECT id, nom, email, password_hash, role, statut_compte, doit_changer_mdp
       FROM users WHERE role IN ('candidat', 'partenaire') AND lower(email) = lower($1) LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    const u = rows[0];
    if (!u) return res.status(401).json({ message: "Identifiants invalides" });

    const ok = await bcrypt.compare(motdepasse, u.password_hash);
    if (!ok) return res.status(401).json({ message: "Identifiants invalides" });
    if (u.statut_compte !== "actif") {
      return res.status(403).json({ message: "Ce compte est suspendu. Contactez l'administration." });
    }

    const accessToken = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ id: u.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
    setRefreshCookie(res, refreshToken);

    return res.json({
      accessToken,
      utilisateur: { id: u.id, nom: u.nom, email: u.email, role: u.role, doit_changer_mdp: u.doit_changer_mdp },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

// ---------- Refresh token (tous rôles) ----------
export async function refreshToken(req, res) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "Refresh token manquant" });

    let payload;
    try {
      payload = jwt.verify(token, REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: "Refresh token invalide" });
    }

    const { rows } = await pool.query(
      "SELECT id, nom, email, role FROM users WHERE id = $1 LIMIT 1",
      [payload.id]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });

    return res.json({ accessToken, utilisateur: user });
  } catch (err) {
    console.error("refreshToken error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

// ---------- Logout (clear cookie) ----------
export function logoutUser(_req, res) {
  res.clearCookie("refreshToken", { path: "/backend/auth" });
  return res.json({ ok: true });
}

// ---------- Me (tous rôles, utilisé par AuthContext) ----------
export async function getMe(req, res) {
  try {
    const { id, email, role } = req.user || {};
    if (id === undefined) return res.status(401).json({ message: "Non authentifié" });

    // Compte de secours .env (id: 0) : n'existe pas dans `users`.
    if (id === 0) {
      return res.json({ user: { id: 0, email, role: role || "admin" } });
    }

    const { rows } = await pool.query(
      "SELECT id, nom, prenom, email, role, doit_changer_mdp FROM users WHERE id = $1 LIMIT 1",
      [id]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });

    return res.json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}


// ---------- Mot de passe oublié (candidat & partenaire) ----------
// POST /backend/auth/forgot-password  { email }
export async function forgotPassword(req, res) {
  const reponseGenerique = { message: "Si ce compte existe, un email de réinitialisation a été envoyé." };
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email requis." });

    const { rows } = await pool.query(
      `SELECT id, email FROM users WHERE role IN ('candidat','partenaire') AND lower(email) = lower($1) LIMIT 1`,
      [email]
    );
    // Réponse identique que le compte existe ou non (pas d'énumération de comptes).
    if (!rows.length) return res.json(reponseGenerique);

    const user = rows[0];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expireLe = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000);

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expire_le) VALUES ($1, $2, $3)`,
      [user.id, hashToken(rawToken), expireLe]
    );

    const resetLink = `${PUBLIC_BASE_URL}/reset-password/${rawToken}`;
    try {
      await transporter.sendMail({
        from: `"CDO TCHAD" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        html: `
          <p>Une demande de réinitialisation de mot de passe a été effectuée pour ce compte.</p>
          <p><a href="${resetLink}">Cliquez ici pour définir un nouveau mot de passe</a> (valable ${RESET_TOKEN_TTL_MIN} minutes).</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        `,
      });
    } catch (mailErr) {
      // On ne révèle pas l'échec d'envoi (anti-énumération) ; on journalise seulement.
      console.error("⚠️ forgotPassword (candidat/partenaire) envoi e-mail échoué :", mailErr?.message || mailErr);
    }
    return res.json(reponseGenerique);
  } catch (err) {
    console.error("❌ forgotPassword (candidat/partenaire) :", err);
    return res.json(reponseGenerique);
  }
}

// POST /backend/auth/reset-password/:token  { newPassword }
export async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token et nouveau mot de passe requis." });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }

    const { rows } = await pool.query(
      `SELECT pr.id, pr.user_id FROM password_resets pr
         JOIN users u ON u.id = pr.user_id
        WHERE pr.token_hash = $1 AND pr.utilise = false AND pr.expire_le > now()
          AND u.role IN ('candidat','partenaire')
        LIMIT 1`,
      [hashToken(token)]
    );
    if (!rows.length) {
      return res.status(400).json({ message: "Lien de réinitialisation invalide ou expiré." });
    }

    const { id: resetId, user_id } = rows[0];
    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.query("BEGIN");
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user_id]);
    await pool.query("UPDATE password_resets SET utilise = true WHERE id = $1", [resetId]);
    await pool.query("COMMIT");

    return res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("❌ resetPassword (candidat/partenaire) :", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}
