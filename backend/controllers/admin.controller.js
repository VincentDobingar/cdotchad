// 📁 controllers/admin.controller.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

/** ─────────── Config & helpers ─────────── **/

// Support d’un compte "secours" via variables d'env (facultatif)
// Si tu ne veux PAS de fallback env, passe ADMIN_ENV_LOGIN_ENABLED=false
const ADMIN_ENV_LOGIN_ENABLED = String(process.env.ADMIN_ENV_LOGIN_ENABLED ?? "true") === "true";
const ADMIN_EMAIL    = (process.env.ADMIN_EMAIL || "admin@cdotchad.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123";

// Secret & TTL
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || "devsecret";
const DEFAULT_TTL = process.env.ADMIN_TOKEN_TTL || "2h";          // si remember=false
const REMEMBER_TTL = process.env.ADMIN_TOKEN_TTL_REMEMBER || "7d"; // si remember=true

function signAdminToken(admin, ttl = DEFAULT_TTL) {
  const payload = { id: admin.id, email: admin.email, role: admin.role || "admin" };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ttl });
}

/** ─────────── Login DB + fallback env ─────────── **/

// POST /backend/admin/login
export async function loginAdmin(req, res) {
  try {
    const body = req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const pwd   = String(body.password ?? body.motdepasse ?? "").trim();
    const remember = Boolean(body.remember);

    if (!email || !pwd) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // 1) Cherche l'admin en base
    const { rows } = await pool.query(
      `SELECT id, email, motdepasse, role
         FROM public.administrateurs
        WHERE lower(email) = lower($1)
        LIMIT 1`,
      [email]
    );

    // 1.a) Si trouvé en BDD → compare le hash bcrypt
    if (rows.length) {
      const admin = rows[0];
      const ok = await bcrypt.compare(pwd, admin.motdepasse || "");
      if (!ok) return res.status(401).json({ message: "Identifiants invalides" });

      const token = signAdminToken({ id: admin.id, email: admin.email, role: admin.role }, remember ? REMEMBER_TTL : DEFAULT_TTL);
      res.set("Authorization", `Bearer ${token}`);
      return res.json({ token, admin: { id: admin.id, email: admin.email, role: admin.role } });
    }

    // 2) Fallback ENV (optionnel, utile si la BDD est vide/HS)
    if (ADMIN_ENV_LOGIN_ENABLED && email === ADMIN_EMAIL && pwd === ADMIN_PASSWORD) {
      const admin = { id: 0, email: ADMIN_EMAIL, role: "admin" };
      const token = signAdminToken(admin, remember ? REMEMBER_TTL : DEFAULT_TTL);
      res.set("Authorization", `Bearer ${token}`);
      return res.json({ token, admin });
    }

    // 3) Sinon → 401 neutre
    return res.status(401).json({ message: "Identifiants invalides" });
  } catch (err) {
    console.error("❌ loginAdmin:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

/** ─────────── Refresh ─────────── **/

// POST /backend/admin/refresh
export async function refreshSession(req, res) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || "";
    const token =
      (auth.startsWith("Bearer ") ? auth.slice(7) : null) ||
      req.cookies?.admin_token ||
      null;

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

// GET /backend/admin/me (req.admin est posé par verifyAdminToken)
export async function getAdminMe(req, res) {
  if (!req.admin) return res.status(401).json({ message: "Non authentifié" });
  return res.json({ admin: req.admin });
}

/** Placeholders non implémentés (inchangés) **/
export async function changePassword(_req, res)   { return res.status(501).json({ error: "NOT_IMPLEMENTED", at: "changePassword" }); }
export async function forgotPassword(_req, res)    { return res.status(501).json({ error: "NOT_IMPLEMENTED", at: "forgotPassword" }); }
export async function resetPassword(_req, res)     { return res.status(501).json({ error: "NOT_IMPLEMENTED", at: "resetPassword" }); }
export async function getAllAdmins(_req, res)      { return res.status(501).json({ error: "NOT_IMPLEMENTED", at: "getAllAdmins" }); }
export async function ajouterAdministrateur(_req, res) { return res.status(501).json({ error: "NOT_IMPLEMENTED", at: "ajouterAdministrateur" }); }
export async function deleteAdmin(_req, res)       { return res.status(501).json({ error: "NOT_IMPLEMENTED", at: "deleteAdmin" }); }
