// 📁 controllers/admin.controller.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { transporter } from "../services/email.service.js";

/** ─────────── Config & helpers ─────────── **/

// Support d'un compte "secours" via variables d'env (facultatif), utile en cas de
// perte d'accès. Ce compte virtuel (id: 0) n'existe pas dans `users` : les
// actions qui modifient un compte réel (changePassword...) le rejettent.
const ADMIN_ENV_LOGIN_ENABLED = String(process.env.ADMIN_ENV_LOGIN_ENABLED ?? "true") === "true";
const ADMIN_EMAIL    = (process.env.ADMIN_EMAIL || "admin@cdotchad.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123";

const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_TTL = process.env.ADMIN_TOKEN_TTL || "2h";          // si remember=false
const REMEMBER_TTL = process.env.ADMIN_TOKEN_TTL_REMEMBER || "7d"; // si remember=true

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:5173";
const RESET_TOKEN_TTL_MIN = 30;

function signAdminToken(admin, ttl = DEFAULT_TTL) {
  const payload = { id: admin.id, email: admin.email, role: admin.role || "admin" };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ttl });
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/** ─────────── Login DB (table `users`) + fallback env ─────────── **/

// POST /backend/admin/login
export async function loginAdmin(req, res) {
  try {
    const body = req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const pwd = String(body.password ?? body.motdepasse ?? "").trim();
    const remember = Boolean(body.remember);

    if (!email || !pwd) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // 1) Fallback ENV AVANT la base (compte de secours)
    if (ADMIN_ENV_LOGIN_ENABLED && email === ADMIN_EMAIL && pwd === ADMIN_PASSWORD) {
      const admin = { id: 0, email: ADMIN_EMAIL, role: "admin" };
      const token = signAdminToken(admin, remember ? REMEMBER_TTL : DEFAULT_TTL);
      res.set("Authorization", `Bearer ${token}`);
      return res.json({ token, admin });
    }

    // 2) Table users (role admin ou superadmin)
    let rows = [];
    try {
      const result = await pool.query(
        `SELECT id, email, password_hash, role
           FROM users
          WHERE role IN ('admin', 'superadmin')
            AND lower(email) = lower($1)
          LIMIT 1`,
        [email]
      );
      rows = result.rows || [];
    } catch (dbErr) {
      console.error("❌ ERREUR SQL loginAdmin:", dbErr);
      return res.status(500).json({
        message: "Erreur base de données login",
        detail: dbErr.message,
      });
    }

    if (!rows.length) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const admin = rows[0];
    const ok = await bcrypt.compare(pwd, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = signAdminToken(
      { id: admin.id, email: admin.email, role: admin.role },
      remember ? REMEMBER_TTL : DEFAULT_TTL
    );

    res.set("Authorization", `Bearer ${token}`);
    return res.json({
      token,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error("❌ loginAdmin FATAL:", err);
    return res.status(500).json({
      message: "Erreur serveur login",
      detail: err.message,
    });
  }
}

/** ─────────── Refresh ─────────── **/

// POST /backend/admin/refresh
export async function refreshSession(req, res) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Token manquant" });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: e?.name || "Token invalide" });
    }

    const fresh = signAdminToken(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      DEFAULT_TTL
    );

    res.set("Authorization", `Bearer ${fresh}`);
    return res.json({ token: fresh });
  } catch (err) {
    console.error("❌ refreshSession:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

// GET /backend/admin/me (req.admin est posé par requireRole)
export async function getAdminMe(req, res) {
  if (!req.admin) return res.status(401).json({ message: "Non authentifié" });
  return res.json({ admin: req.admin });
}

/** ─────────── Changement de mot de passe (admin connecté) ─────────── **/

// PUT /backend/admin/change-password  { currentPassword, newPassword }
export async function changePassword(req, res) {
  try {
    const adminId = req.admin?.id;
    if (adminId === 0) {
      return res.status(400).json({
        message: "Le compte de secours (.env) ne peut pas être modifié depuis cette interface.",
      });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Mot de passe actuel et nouveau mot de passe requis." });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }

    const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [adminId]);
    if (!rows.length) return res.status(404).json({ message: "Compte introuvable." });

    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ message: "Mot de passe actuel incorrect." });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, adminId]);

    return res.json({ message: "Mot de passe mis à jour." });
  } catch (err) {
    console.error("❌ changePassword:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

/** ─────────── Mot de passe oublié ─────────── **/

// POST /backend/admin/forgot-password  { email }
export async function forgotPassword(req, res) {
  const genericResponse = { message: "Si ce compte existe, un email de réinitialisation a été envoyé." };

  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email requis." });

    const { rows } = await pool.query(
      `SELECT id, email FROM users WHERE role IN ('admin','superadmin') AND lower(email) = lower($1) LIMIT 1`,
      [email]
    );

    // Réponse identique que le compte existe ou non (pas d'énumération de comptes).
    if (!rows.length) return res.json(genericResponse);

    const user = rows[0];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expireLe = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000);

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expire_le) VALUES ($1, $2, $3)`,
      [user.id, hashToken(rawToken), expireLe]
    );

    const resetLink = `${PUBLIC_BASE_URL}/admin/reset-password/${rawToken}`;
    await transporter.sendMail({
      from: `"CDO TCHAD" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe administrateur",
      html: `
        <p>Une demande de réinitialisation de mot de passe a été effectuée pour ce compte.</p>
        <p><a href="${resetLink}">Cliquez ici pour définir un nouveau mot de passe</a> (valable ${RESET_TOKEN_TTL_MIN} minutes).</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `,
    });

    return res.json(genericResponse);
  } catch (err) {
    console.error("❌ forgotPassword:", err);
    // On ne fuite jamais le détail de l'erreur ici non plus.
    return res.json(genericResponse);
  }
}

// POST /backend/admin/reset-password/:token  { newPassword }
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

    const tokenHash = hashToken(token);
    const { rows } = await pool.query(
      `SELECT id, user_id FROM password_resets
        WHERE token_hash = $1 AND utilise = false AND expire_le > now()
        LIMIT 1`,
      [tokenHash]
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
    console.error("❌ resetPassword:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

/** ─────────── Gestion des comptes admin (superadmin uniquement) ─────────── **/

// GET /backend/admin/admins
export async function getAllAdmins(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, prenom, email, role, statut_compte, cree_le
         FROM users
        WHERE role IN ('admin', 'superadmin')
        ORDER BY cree_le DESC`
    );
    return res.json({ admins: rows });
  } catch (err) {
    console.error("❌ getAllAdmins:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

// POST /backend/admin/admins  { email, password, role, nom?, prenom? }
export async function ajouterAdministrateur(req, res) {
  try {
    const { email, password, role = "admin", nom, prenom } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }
    if (!["admin", "superadmin"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide (admin ou superadmin uniquement)." });
    }

    const existing = await pool.query("SELECT id FROM users WHERE lower(email) = lower($1)", [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: "Un compte existe déjà avec cet email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (nom, prenom, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nom, prenom, email, role, cree_le`,
      [nom || null, prenom || null, String(email).trim().toLowerCase(), passwordHash, role]
    );

    return res.status(201).json({ admin: rows[0] });
  } catch (err) {
    console.error("❌ ajouterAdministrateur:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}

// DELETE /backend/admin/admins/:id
export async function deleteAdmin(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "ID invalide." });

    if (req.admin?.id === id) {
      return res.status(400).json({ message: "Impossible de supprimer votre propre compte." });
    }

    const { rowCount } = await pool.query(
      "DELETE FROM users WHERE id = $1 AND role IN ('admin', 'superadmin')",
      [id]
    );

    if (!rowCount) return res.status(404).json({ message: "Compte administrateur introuvable." });
    return res.json({ message: "Compte supprimé." });
  } catch (err) {
    console.error("❌ deleteAdmin:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
}
