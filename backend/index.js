// 📁 public_html/backend/index.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { pool } from "./config/db.js"; // optionnel, pour un petit test DB

dotenv.config();

const app = express();
app.set("trust proxy", true);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Toutes les routes API commencent par /backend
const BASE = "/backend";

/* ------------------------------------------------------------------ */
/*  A. ROUTES ULTRA-LÉGÈRES AVANT TOUT (hors CORS / no-cache)         */
/* ------------------------------------------------------------------ */
app.get(`${BASE}/ping`, (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.type("text/plain").send("pong");
});
app.head(`${BASE}/ping`, (_req, res) => res.status(200).end());

app.get(`${BASE}/health`, (_req, res) =>
  res.json({ status: "ok", node: process.version, when: new Date().toISOString() })
);

/* ----------------------- Sécurité & perfs ------------------------- */
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.CSP_DISABLE === "1"
        ? false
        : {
            useDefaults: true,
            directives: {
              "img-src": ["'self'", "data:", "https:"],
              "script-src-attr": ["'none'"],
            },
          },
  })
);
app.use(compression());

/* -------------------- Middlewares globaux ------------------------- */
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* -------------------------- CORS --------------------------------- */
const ORIGINS = new Set([
  "http://localhost:5173",
  "https://cdotchad.com",
  "https://www.cdotchad.com",
]);
app.use(
  cors({
    origin: (origin, cb) => (!origin || ORIGINS.has(origin) ? cb(null, true) : cb(new Error("CORS blocked"))),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.options(/.*/, cors());

/* ----------- Préparation dossiers uploads (si manquants) ---------- */
for (const folder of ["cv", "lettres", "diplomes", "galerie", "actualites", "documents"]) {
  const dirPath = path.join(__dirname, "uploads", folder);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

/* ----------- Fichiers statiques d'uploads (long cache) ------------ */
const uploadsStaticOpts = {
  etag: true,
  lastModified: true,
  maxAge: "1y",
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.removeHeader("Pragma");
    res.removeHeader("Expires");
  },
};
app.use(`${BASE}/uploads`, express.static(path.join(__dirname, "uploads"), uploadsStaticOpts));
// Alias rétrocompat en cas d’anciennes URLs
app.use(`/api/uploads`, express.static(path.join(__dirname, "uploads"), uploadsStaticOpts));

/* ----------- No-cache API (sauf uploads/ping/health) -------------- */
app.use((req, res, next) => {
  if (
    req.path.startsWith(`${BASE}/uploads`) ||
    req.path.startsWith(`/api/uploads`) ||
    req.path === `${BASE}/ping` ||
    req.path === `${BASE}/health`
  ) {
    return next();
  }
  if (req.path.startsWith(BASE)) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
  }
  next();
});

/* -------------------- Point d’information racine ------------------ */
app.get(BASE, (_req, res) => res.send("✅ API CDO Tchad opérationnelle !"));
app.get(`${BASE}/`, (_req, res) => res.send("✅ API CDO Tchad opérationnelle !"));

/* ---------------------- Imports de routes (tes noms) -------------- */
import adminRoutes from "./routes/admin.js";
import adminStatsRoutes from "./routes/adminStats.routes.js";
import authRoutes from "./routes/auth.routes.js";
import utilisateursRoutes from "./routes/utilisateurs.routes.js";
import actualitesRoutes from "./routes/actualites.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import galerieRoutes from "./routes/galerie.routes.js";
import offresRoutes from "./routes/offres.js";
import candidatureRoutes from "./routes/candidatureRoutes.js";


/* ------------------- Montage des routers -------------------------- */
app.use(`${BASE}/admin`, adminRoutes);
app.use(`${BASE}/admin/stats`, adminStatsRoutes);
app.use(`${BASE}/auth`, authRoutes);
app.use(`${BASE}/utilisateurs`, utilisateursRoutes);
app.use(`${BASE}/actualites`, actualitesRoutes);
app.use(`${BASE}/contact`, contactRoutes);
app.use(`${BASE}/messages`, messagesRoutes);
app.use(`${BASE}/services`, servicesRoutes);
app.use(`${BASE}/galerie`, galerieRoutes);
app.use(`${BASE}/offres`, offresRoutes);
app.use(`${BASE}/candidatures`, candidatureRoutes);

/* ----------------------- 404 & gestion erreurs -------------------- */
app.use((req, res, next) => {
  if (req.path.startsWith(BASE)) {
    return res.status(404).json({ message: "Route introuvable" });
  }
  next();
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("🔥 Erreur API:", err);
  const code = err.status || err.statusCode || 500;
  res.status(code).json({ message: err.message || "Erreur serveur" });
});

/* ---------------------- Petit test PostgreSQL --------------------- */
pool.query("SELECT NOW()", (err, r) => {
  if (err) console.error("❌ PostgreSQL:", err);
  else console.log("✅ PostgreSQL connecté:", r.rows[0]);
});

/* --------------------------- Démarrage ---------------------------- */
// Sur Passenger (cPanel), NODE_ENV=production => pas d’app.listen nécessaire.
// En local, on lance le serveur.
const PORT = process.env.PORT || process.env.NODE_PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`➡️  API démarrée sur http://localhost:${PORT}${BASE}`);
  });
}

export default app;
