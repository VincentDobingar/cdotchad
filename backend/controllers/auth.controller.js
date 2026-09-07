// controllers/auth.controller.js
// Authentification candidat (inscription/connexion) + refresh token unique,
// tous rôles confondus, contre la table `users`.
import jwt from "jsonwebtoken";
import bcrypt from "../lib/bcryptAdapter.js";
import { pool } from "../config/db.js";

const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || "7d";
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET;

function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/backend/auth",
  });
}

// ---------- Register candidat ----------
export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Champs requis manquants." });

    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [email.toLowerCase().trim()]
    );
    if (existing.length > 0) return res.status(409).json({ message: "Email déjà utilisé." });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (nom, email, password_hash, role)
       VALUES ($1, $2, $3, 'candidat') RETURNING id, nom, email, role`,
      [name || null, email.toLowerCase().trim(), hash]
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

    const { rows } = await pool.query(
      "SELECT id, nom, email, password_hash, role FROM users WHERE role = 'candidat' AND lower(email) = lower($1) LIMIT 1",
      [email.toLowerCase().trim()]
    );
    const u = rows[0];
    if (!u) return res.status(401).json({ message: "Identifiants invalides" });

    const ok = await bcrypt.compare(motdepasse, u.password_hash);
    if (!ok) return res.status(401).json({ message: "Identifiants invalides" });

    const accessToken = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ id: u.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
    setRefreshCookie(res, refreshToken);

    return res.json({ accessToken, utilisateur: { id: u.id, nom: u.nom, email: u.email, role: u.role } });
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
