// 📁 controllers/adminStatsController.js
import { pool } from "../config/db.js";

export async function getAdminStats(_req, res) {
  try {
    const [offres, cands, users, news] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM offres"),
      pool.query("SELECT COUNT(*)::int AS n FROM candidatures"),
      pool.query("SELECT COUNT(*)::int AS n FROM utilisateurs"),
      pool.query("SELECT COUNT(*)::int AS n FROM actualites"),
    ]);
    res.json({
      total_offres: offres.rows[0].n,
      total_candidatures: cands.rows[0].n,
      total_utilisateurs: users.rows[0].n,
      total_actualites: news.rows[0].n,              // 🆕
    });
  } catch (err) {
    console.error("❌ [ADMIN/STATS] Error:", err);
    res.status(500).json({ error: "STATS_FAILED", details: err.message });
  }
}

export async function getCandidaturesParMois(req, res) {
  const year = String(req.query.year || new Date().getFullYear());
  try {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(date_trunc('month', date_candidature), 'YYYY-MM') AS mois,
              COUNT(*)::int AS total
         FROM candidatures
        WHERE EXTRACT(YEAR FROM date_candidature) = $1::int
     GROUP BY 1
     ORDER BY 1 ASC`,
      [year]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ [ADMIN/STATS/mois] Error:", err);
    res.status(500).json({ error: "STATS_MONTH_FAILED", details: err.message });
  }
}

export async function getAdminStatsResume(req, res) {
  const year = String(req.query.year || new Date().getFullYear());
  const month = req.query.month ? String(req.query.month).padStart(2, "0") : null;

  try {
    const joinDateCond = month
      ? `AND EXTRACT(YEAR FROM c.date_candidature) = $1::int AND TO_CHAR(c.date_candidature,'MM') = $2`
      : `AND EXTRACT(YEAR FROM c.date_candidature) = $1::int`;
    const params = month ? [year, month] : [year];

    const [totalCands, totalUsers, totalOffres, totalNews] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM candidatures"),
      pool.query("SELECT COUNT(*)::int AS n FROM utilisateurs"),
      pool.query("SELECT COUNT(*)::int AS n FROM offres"),
      pool.query("SELECT COUNT(*)::int AS n FROM actualites"),
    ]);

    const candidaturesParMois = await pool.query(
      `SELECT TO_CHAR(date_trunc('month', date_candidature), 'MM') AS mois,
              COUNT(*)::int AS total
         FROM candidatures
        WHERE EXTRACT(YEAR FROM date_candidature) = $1::int
          ${month ? "AND TO_CHAR(date_candidature,'MM') = $2" : ""}
     GROUP BY 1
     ORDER BY 1 ASC`,
      params
    );

    const candidaturesParOffre = await pool.query(
      `SELECT o.titre, COALESCE(COUNT(c.id), 0)::int AS total
         FROM offres o
    LEFT JOIN candidatures c ON o.id = c.offre_id
        ${joinDateCond}
     GROUP BY o.titre
     ORDER BY total DESC`,
      params
    );

    const parTypeContrat = await pool.query(
      `SELECT o.type_contrat, COALESCE(COUNT(c.id), 0)::int AS total
         FROM offres o
    LEFT JOIN candidatures c ON o.id = c.offre_id
        ${joinDateCond}
     GROUP BY o.type_contrat
     ORDER BY total DESC`,
      params
    );

    // 🔧 Normalisation apostrophes pour regrouper N’Djamena/N'Djamena
    const parLieu = await pool.query(
      `SELECT REPLACE(REPLACE(REPLACE(o.lieu, CHR(8217), ''''), CHR(180), ''''), CHR(96), '''') AS lieu,
              COALESCE(COUNT(c.id), 0)::int AS total
         FROM offres o
    LEFT JOIN candidatures c ON o.id = c.offre_id
        ${joinDateCond}
     GROUP BY 1
     ORDER BY total DESC
     LIMIT 5`,
      params
    );

    // 🆕 Par employeur
    const parEmployeur = await pool.query(
      `SELECT o.employeur, COALESCE(COUNT(c.id), 0)::int AS total
         FROM offres o
    LEFT JOIN candidatures c ON o.id = c.offre_id
        ${joinDateCond}
     GROUP BY o.employeur
     ORDER BY total DESC`,
      params
    );

    // 🆕 Actualités par catégorie (filtré par année)
    let actualitesScope = "year";
    let actualitesParCategorieRes = await pool.query(
      `SELECT COALESCE(categorie, 'Non renseignée') AS categorie,
              COUNT(*)::int AS total
         FROM actualites
        WHERE EXTRACT(YEAR FROM date_publication) = $1::int
     GROUP BY COALESCE(categorie, 'Non renseignée')
     ORDER BY total DESC`,
      [year]
    );
    
    if (actualitesParCategorieRes.rowCount === 0) {
      // 🔁 Fallback : toutes années confondues
      actualitesParCategorieRes = await pool.query(
        `SELECT COALESCE(categorie, 'Non renseignée') AS categorie,
                COUNT(*)::int AS total
           FROM actualites
       GROUP BY COALESCE(categorie, 'Non renseignée')
       ORDER BY total DESC`
      );
      actualitesScope = "all";
    }

    const nextYear = String(Number(year) + 1);
    const multiYearData = await pool.query(
      `SELECT TO_CHAR(date_trunc('month', date_candidature),'MM') AS mois,
              EXTRACT(YEAR FROM date_candidature)::TEXT AS annee,
              COUNT(*)::int AS total
         FROM candidatures
        WHERE EXTRACT(YEAR FROM date_candidature) IN ($1::int, $2::int)
     GROUP BY annee, mois
     ORDER BY annee, mois`,
      [year, nextYear]
    );

    res.json({
      total_candidatures: totalCands.rows[0].n,
      total_utilisateurs: totalUsers.rows[0].n,
      total_offres: totalOffres.rows[0].n,
      total_actualites: totalNews.rows[0].n,          // 🆕
      candidatures_par_mois: candidaturesParMois.rows,
      candidatures_par_offre: candidaturesParOffre.rows,
      par_type_contrat: parTypeContrat.rows,
      par_lieu: parLieu.rows,
      par_employeur: parEmployeur.rows,
      actualites_par_categorie: actualitesParCategorieRes.rows,
      actualites_scope: actualitesScope,   // "year" ou "all"
      actualites_year: year,
      multi_year_data: multiYearData.rows,
    });
  } catch (err) {
    console.error("❌ [ADMIN/STATS/resume] Error:", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "STATS_RESUME_FAILED", details: err.message });
  }
}
