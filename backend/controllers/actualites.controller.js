// 📁 controllers/actualites.controller.js
import { pool } from "../config/db.js";
import fs from "fs/promises";
import path from "path";

/* ---------------- Helpers ---------------- */

const buildImageUrl = (raw, req) => {
  if (!raw) return null;

  // Valeurs attendues dans la BDD: "uploads/actualites/xxx.jpg"
  // On nettoie d'abord les variantes tordues.
  let v = String(raw)
    .replace(/\/api\/u?ploads\//i, "uploads/")   // corrige /api/uploads ou /api/uLoads
    .replace(/^\/?uploads\//, "uploads/");       // force "uploads/..." sans slash en tête

  // Si déjà absolue => on renvoie tel quel
  if (/^https?:\/\//i.test(v)) return v;

  const BASE = "/backend"; // ton BASE global dans index.js
  return `${req.protocol}://${req.get("host")}${BASE}/${v}`;
};

// La date de publication est stockée sans fuseau horaire. On la renvoie en "AAAA-MM-JJ"
// pour que tous les visiteurs voient le même jour, quel que soit leur fuseau (sinon un
// visiteur au Tchad voyait la veille pendant l'heure d'été du serveur).
const jourPublication = (d) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return d ?? null;
  const deux = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
};

/* ---------------- STATS ------------------ */

// ✅ Statistiques (catégories et mois)
export const getActualitesStats = async (req, res) => {
  try {
    const catRes = await pool.query(`
      SELECT categorie, COUNT(*) AS count
      FROM actualites
      WHERE categorie IS NOT NULL
      GROUP BY categorie
    `);

    const moisRes = await pool.query(`
      SELECT 
        TO_CHAR(date_publication, 'Month') AS mois,
        EXTRACT(MONTH FROM date_publication) AS mois_num,
        EXTRACT(YEAR FROM date_publication) AS annee,
        COUNT(*) AS count
      FROM actualites
      WHERE date_publication IS NOT NULL
      GROUP BY mois, mois_num, annee
      ORDER BY annee, mois_num
    `);

    const categorieCount = catRes.rows.map((r) => ({
      categorie: r.categorie,
      count: parseInt(r.count, 10),
    }));

    const moisCount = moisRes.rows.map((r) => ({
      mois: r.mois.trim(),
      count: parseInt(r.count, 10),
      mois_num: parseInt(r.mois_num, 10),
      annee: parseInt(r.annee, 10),
    }));

    res.json({ categorieCount, moisCount });
  } catch (err) {
    console.error("Erreur stats actualités :", err);
    res.status(500).json({ message: "Erreur chargement statistiques." });
  }
};

/* --------------- READ -------------------- */

// ✅ Obtenir une actualité par son ID (image normalisée)
export const getActualiteById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM actualites WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Actualité non trouvée" });
    }

    const a = result.rows[0];
    a.image = buildImageUrl(a.image, req); // normalise l'URL d'image
    a.date_publication = jourPublication(a.date_publication);
    res.json(a);
  } catch (error) {
    console.error("Erreur getActualiteById :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// â Obtenir toutes les actualitÃ©s : filtrage, tri et pagination cÃ´tÃ© serveur.
// Avant, l'API ignorait les critÃ¨res et renvoyait toujours les plus rÃ©centes ; le tri/filtre
// ne s'appliquait alors qu'Ã  la page reÃ§ue cÃ´tÃ© navigateur. On applique ici recherche,
// catÃ©gorie, annÃ©e et mois, un tri sur liste blanche, puis une vraie pagination avec total.
export const getActualites = async (req, res) => {
  try {
    // Pagination : soit "page" (1-based), soit "offset" direct.
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

    const pageRaw = parseInt(req.query.page, 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : null;

    const offsetRaw = parseInt(req.query.offset, 10);
    const offset = page
      ? (page - 1) * limit
      : Number.isFinite(offsetRaw) && offsetRaw >= 0
      ? offsetRaw
      : 0;

    // Filtres (on accepte les alias franÃ§ais "mois"/"annee" utilisÃ©s cÃ´tÃ© administration).
    const search = String(req.query.search || "").trim();
    const categorie = String(req.query.categorie || "").trim();
    const year = parseInt(req.query.year ?? req.query.annee, 10);
    const month = parseInt(req.query.month ?? req.query.mois, 10);

    const where = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      const i = values.length;
      where.push(`(titre ILIKE $${i} OR contenu ILIKE $${i} OR COALESCE(categorie, '') ILIKE $${i})`);
    }
    if (categorie) {
      values.push(categorie);
      where.push(`LOWER(categorie) = LOWER($${values.length})`);
    }
    if (Number.isFinite(year)) {
      values.push(year);
      where.push(`EXTRACT(YEAR FROM date_publication) = $${values.length}`);
    }
    if (Number.isFinite(month) && month >= 1 && month <= 12) {
      values.push(month);
      where.push(`EXTRACT(MONTH FROM date_publication) = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Tri sur liste blanche : seuls ces champs sont autorisÃ©s (le reste retombe sur la date).
    const sortField = String(req.query.sort_by) === "titre" ? "titre" : "date_publication";
    const sortDir = String(req.query.sort || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM actualites ${whereClause}`,
      values
    );
    const total = countResult.rows[0]?.total || 0;

    // Le tri se termine par l'identifiant : sans lui, deux actualitÃ©s de mÃªme date pourraient
    // changer d'ordre d'une page Ã  l'autre (doublon d'un cÃ´tÃ©, oubli de l'autre).
    const dataResult = await pool.query(
      `SELECT * FROM actualites
       ${whereClause}
       ORDER BY ${sortField} ${sortDir} NULLS LAST, id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    const data = dataResult.rows.map((a) => ({
      ...a,
      image: buildImageUrl(a.image, req),
      date_publication: jourPublication(a.date_publication),
    }));

    res.json({
      data,
      total,
      page: page || Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Erreur getActualites :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/* --------------- CREATE ------------------ */

// ✅ Ajout actualité (retourne l’objet créé avec image normalisée)
export const createActualite = async (req, res) => {
  const { titre, contenu, date_publication, categorie } = req.body;
  const relImage = req.file ? `uploads/actualites/${req.file.filename}` : null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO actualites (titre, contenu, image, date_publication, categorie)
       VALUES ($1, $2, $3, COALESCE($4, NOW()), $5)
       RETURNING *`,
      [titre, contenu, relImage, date_publication || null, categorie || null]
    );

    const a = rows[0];
    a.image = buildImageUrl(a.image, req);
    a.date_publication = jourPublication(a.date_publication);
    res.status(201).json(a);
  } catch (err) {
    console.error("Erreur ajout actualité:", err);
    // si upload présent et erreur DB → supprimer le fichier
    if (relImage) await unlinkSafe(relToAbs(relImage));
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* --------------- UPDATE ------------------ */

// ✅ Mise à jour paramétrée + remplacement image (safe) + normalisation URL
export const updateActualite = async (req, res) => {
  const { id } = req.params;
  const { titre, contenu, categorie, date_publication } = req.body;
  const hasNewImage = !!req.file;
  const relNew = hasNewImage ? `uploads/actualites/${req.file.filename}` : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Récupère l’ancienne image
    const { rows: prevRows } = await client.query(
      "SELECT image FROM actualites WHERE id = $1",
      [id]
    );
    if (!prevRows.length) {
      if (hasNewImage) await unlinkSafe(relToAbs(relNew));
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Actualité non trouvée" });
    }
    const oldRel = prevRows[0].image;

    // Build SET dynamique
    const sets = [];
    const vals = [];
    let i = 1;

    if (typeof titre !== "undefined") { sets.push(`titre = $${i++}`); vals.push(titre); }
    if (typeof contenu !== "undefined") { sets.push(`contenu = $${i++}`); vals.push(contenu); }
    if (typeof categorie !== "undefined") { sets.push(`categorie = $${i++}`); vals.push(categorie); }
    if (typeof date_publication !== "undefined") { sets.push(`date_publication = $${i++}`); vals.push(date_publication || null); }
    if (hasNewImage) { sets.push(`image = $${i++}`); vals.push(relNew); }

    if (!sets.length) {
      await client.query("ROLLBACK");
      if (hasNewImage) await unlinkSafe(relToAbs(relNew));
      return res.status(400).json({ error: "Aucune modification fournie." });
    }

    vals.push(id);
    const { rows } = await client.query(
      `UPDATE actualites SET ${sets.join(", ")}
       WHERE id = $${i}
       RETURNING *`,
      vals
    );

    await client.query("COMMIT");

    // Supprime l’ancienne image si remplacée
    if (hasNewImage && oldRel) {
      await unlinkSafe(relToAbs(oldRel));
    }

    const a = rows[0];
    a.image = buildImageUrl(a.image, req);
    a.date_publication = jourPublication(a.date_publication);
    res.json(a);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erreur mise à jour actualité:", err);
    if (hasNewImage) await unlinkSafe(relToAbs(relNew));
    res.status(500).json({ error: "Erreur mise à jour actualité" });
  } finally {
    client.release();
  }
};

/* --------------- DELETE ------------------ */

// ✅ Suppression (DB + fichier) + normalisation
export const deleteActualite = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT image FROM actualites WHERE id = $1",
      [id]
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Actualité introuvable" });
    }

    const rel = rows[0].image;
    await client.query("DELETE FROM actualites WHERE id = $1", [id]);
    await client.query("COMMIT");

    if (rel) await unlinkSafe(relToAbs(rel));

    res.json({ message: "Actualité supprimée" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la suppression:", err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  } finally {
    client.release();
  }
};

/* --------------- LISTES ------------------ */

// ✅ Liste des années
export const getAnneesActualites = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT EXTRACT(YEAR FROM date_publication)::int AS annee
      FROM actualites
      ORDER BY annee DESC
    `);
    const annees = result.rows.map((row) => row.annee);
    res.json(annees);
  } catch (err) {
    console.error("Erreur récupération des années:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Liste des catégories
export const getCategoriesActualites = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT categorie
      FROM actualites
      WHERE categorie IS NOT NULL
      ORDER BY categorie
    `);
    const categories = result.rows.map((row) => row.categorie);
    res.json(categories);
  } catch (err) {
    console.error("Erreur récupération des catégories:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Stats par catégorie (avec filtres year/month)
export const getStatsParCategorie = async (req, res) => {
  const { year, month } = req.query;

  try {
    const values = [];
    const clauses = [];

    if (year) { values.push(parseInt(year, 10)); clauses.push(`EXTRACT(YEAR FROM date_publication) = $${values.length}`); }
    if (month) { values.push(parseInt(month, 10)); clauses.push(`EXTRACT(MONTH FROM date_publication) = $${values.length}`); }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const query = `
      SELECT categorie, COUNT(*) AS total
      FROM actualites
      ${where}
      GROUP BY categorie
      ORDER BY total DESC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur stats actualités :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
  }
};
