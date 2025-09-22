// 📁 controllers/galerie.controller.js
import { pool } from "../config/db.js";
import path from "path";

// Dossier physique (on stocke un chemin RELATIF en BDD)
const BASE_FOLDER = "uploads/galerie";

// Base absolue depuis la requête ou fallback ENV
const getBase = (req) =>
  process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;

// Normalise (valeur brute) -> URL absolue "https://host/uploads/..."
function toAbsoluteUrl(raw, req) {
  if (!raw) return "";
  let p = String(raw).trim();

  // Si on nous donne déjà une URL absolue, garde-la telle quelle
  if (/^https?:\/\//i.test(p)) return p;

  // Nettoyage des préfixes courants
  p = p
    .replace(/^api\//i, "")
    .replace(/^backend\//i, "")
    .replace(/^(uLoads|Uploads)\//, "uploads/")
    .replace(/^\/+/, "");

  if (!/^uploads\//i.test(p)) p = `uploads/${p}`;

  // 👉 on sert les fichiers via /backend/uploads
  return `${getBase(req)}/backend/${p}`;
}

// GET /galerie
export const getGalerie = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, titre, categorie, url, date_upload
         FROM galerie
        ORDER BY date_upload DESC NULLS LAST, id DESC`
    );

    const data = rows.map((r) => ({
      id: r.id,
      titre: r.titre || "Sans titre",
      categorie: r.categorie || "Autres",
      url: toAbsoluteUrl(r.url || r.image || r.path || "", req), // ← URL absolue prête
      date_upload: r.date_upload || r.created_at || null,
    }));

    res.json(data);
  } catch (e) {
    console.error("getGalerie:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// GET /galerie/categories
export const getCategories = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT categorie
         FROM galerie
        WHERE categorie IS NOT NULL AND categorie <> ''
        ORDER BY categorie ASC`
    );
    res.json(rows.map((r) => r.categorie));
  } catch (e) {
    console.error("getCategories:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// POST /galerie
export const createImage = async (req, res) => {
  try {
    const { titre = "", categorie = "" } = req.body;
    if (!req.file) return res.status(400).json({ message: "Fichier image manquant" });

    const relPath = path.posix.join(BASE_FOLDER, req.file.filename);

    const { rows } = await pool.query(
      `INSERT INTO galerie (titre, categorie, url, date_upload)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, titre, categorie, url, date_upload`,
      [titre, categorie, relPath]
    );

    const r = rows[0];
    res.status(201).json({
      ...r,
      url: toAbsoluteUrl(r.url, req),
    });
  } catch (e) {
    console.error("createImage:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// PUT /galerie/:id
export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, categorie } = req.body;

    if (req.file) {
      const relPath = path.posix.join(BASE_FOLDER, req.file.filename);
      const { rows } = await pool.query(
        `UPDATE galerie
            SET titre = COALESCE($1, titre),
                categorie = COALESCE($2, categorie),
                url = $3
          WHERE id = $4
        RETURNING id, titre, categorie, url, date_upload`,
        [titre ?? null, categorie ?? null, relPath, id]
      );
      if (!rows.length) return res.status(404).json({ message: "Introuvable" });
      const r = rows[0];
      return res.json({ ...r, url: toAbsoluteUrl(r.url, req) });
    }

    const { rows } = await pool.query(
      `UPDATE galerie
          SET titre = COALESCE($1, titre),
              categorie = COALESCE($2, categorie)
        WHERE id = $3
      RETURNING id, titre, categorie, url, date_upload`,
      [titre ?? null, categorie ?? null, id]
    );
    if (!rows.length) return res.status(404).json({ message: "Introuvable" });
    const r = rows[0];
    res.json({ ...r, url: toAbsoluteUrl(r.url, req) });
  } catch (e) {
    console.error("updateImage:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// DELETE /galerie/:id
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `DELETE FROM galerie
        WHERE id = $1
      RETURNING id`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Introuvable" });
    res.json({ success: true });
  } catch (e) {
    console.error("deleteImage:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
