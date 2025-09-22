// 📁 controllers/adminStats.controller.js
import { pool } from "../config/db.js";

/* ------------------------------------------------------------
   Helper : vérifier l’existence d’une colonne avant de requêter
------------------------------------------------------------- */
async function hasColumn(table, column) {
  const { rows } = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

/* ------------------------------------------------------------
   GET /admin/stats
   Compteurs globaux + quelques répartitions
------------------------------------------------------------- */
export async function getAdminStats(_req, res) {
  try {
    const [offres, cands, users, admins] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM offres"),
      pool.query("SELECT COUNT(*)::int AS n FROM candidatures"),
      pool.query("SELECT COUNT(*)::int AS n FROM utilisateurs"),
      pool.query("SELECT COUNT(*)::int AS n FROM administrateurs"),
    ]);

    // Candidatures par offre (toutes périodes)
    const parOffre = await pool.query(`
      SELECT o.titre, COUNT(c.id)::int AS count
      FROM offres o
      LEFT JOIN candidatures c ON c.offre_id = o.id
      GROUP BY o.titre
      ORDER BY count DESC
    `);

    // Candidatures par mois (YYYY-MM) / toutes offres
    const parMois = await pool.query(`
      SELECT TO_CHAR(c.date_candidature, 'YYYY-MM') AS mois,
             COUNT(*)::int AS nombre
      FROM candidatures c
      GROUP BY mois
      ORDER BY mois
    `);

    // Répartitions optionnelles selon colonnes disponibles
    const results = {
      total_candidatures: cands.rows[0].n,
      total_utilisateurs: users.rows[0].n,
      total_offres: offres.rows[0].n,
      total_administrateurs: admins.rows[0].n,
      candidatures_par_offre: parOffre.rows.map(r => ({ titre: r.titre, count: r.count })),
      candidatures_par_mois: parMois.rows.map(r => ({ mois: r.mois, nombre: r.nombre })),
      par_categorie: [],
      par_type_contrat: [],
      par_lieu: [],
    };

    if (await hasColumn("offres", "categorie")) {
      const { rows } = await pool.query(`
        SELECT categorie, COUNT(*)::int AS total
        FROM offres
        GROUP BY categorie
        ORDER BY total DESC NULLS LAST
      `);
      results.par_categorie = rows;
    }

    if (await hasColumn("offres", "type_contrat")) {
      const { rows } = await pool.query(`
        SELECT type_contrat, COUNT(*)::int AS total
        FROM offres
        GROUP BY type_contrat
        ORDER BY total DESC NULLS LAST
      `);
      results.par_type_contrat = rows;
    }

    if (await hasColumn("offres", "lieu")) {
      const { rows } = await pool.query(`
        SELECT lieu, COUNT(*)::int AS total
        FROM offres
        GROUP BY lieu
        ORDER BY total DESC NULLS LAST
        LIMIT 5
      `);
      results.par_lieu = rows;
    }

    res.json(results);
  } catch (err) {
    console.error("❌ [ADMIN/STATS] Error:", err);
    res.status(500).json({ error: "STATS_FAILED", details: err.message });
  }
}

/* ------------------------------------------------------------
   GET /admin/stats/candidatures-par-mois?year=YYYY
   Série mensuelle sur une année
------------------------------------------------------------- */
export async function getCandidaturesParMois(req, res) {
  const year = String(req.query.year || new Date().getFullYear());
  try {
    const { rows } = await pool.query(
      `
      SELECT TO_CHAR(date_trunc('month', date_candidature), 'YYYY-MM') AS mois,
             COUNT(*)::int AS total
      FROM candidatures
      WHERE EXTRACT(YEAR FROM date_candidature) = $1::int
      GROUP BY 1
      ORDER BY 1 ASC
      `,
      [year]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ [ADMIN/STATS/mois] Error:", err);
    res.status(500).json({ error: "STATS_MONTH_FAILED", details: err.message });
  }
}

/* ------------------------------------------------------------
   GET /admin/stats/resume?year=YYYY&month=MM (month optionnel)
   KPIs + répartitions (filtrables par année/mois)
   → S’adapte si certaines colonnes d’offres n’existent pas
------------------------------------------------------------- */
export async function getAdminStatsResume(req, res) {
  const year = String(req.query.year || new Date().getFullYear());
  const month = req.query.month ? String(req.query.month).padStart(2, "0") : null;

  try {
    const joinDateCond = month
      ? `AND EXTRACT(YEAR FROM c.date_candidature) = $1::int AND TO_CHAR(c.date_candidature,'MM') = $2`
      : `AND EXTRACT(YEAR FROM c.date_candidature) = $1::int`;
    const params = month ? [year, month] : [year];

    const [totalCands, totalUsers, totalOffres, totalAdmins] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM candidatures"),
      pool.query("SELECT COUNT(*)::int AS n FROM utilisateurs"),
      pool.query("SELECT COUNT(*)::int AS n FROM offres"),
      pool.query("SELECT COUNT(*)::int AS n FROM administrateurs"),
    ]);

    const candidaturesParMois = await pool.query(
      `
      SELECT TO_CHAR(date_trunc('month', date_candidature), 'MM') AS mois,
             COUNT(*)::int AS total
      FROM candidatures
      WHERE EXTRACT(YEAR FROM date_candidature) = $1::int
      ${month ? "AND TO_CHAR(date_candidature,'MM') = $2" : ""}
      GROUP BY 1
      ORDER BY 1 ASC
      `,
      params
    );

    const candidaturesParOffre = await pool.query(
      `
      SELECT o.titre,
             COALESCE(COUNT(c.id), 0)::int AS total
      FROM offres o
      LEFT JOIN candidatures c
             ON o.id = c.offre_id
            ${joinDateCond}
      GROUP BY o.titre
      ORDER BY total DESC
      `,
      params
    );

    // Répartition par type_contrat (si colonne existante)
    let parTypeContratRows = [];
    if (await hasColumn("offres", "type_contrat")) {
      const { rows } = await pool.query(
        `
        SELECT o.type_contrat,
               COALESCE(COUNT(c.id), 0)::int AS total
        FROM offres o
        LEFT JOIN candidatures c
               ON o.id = c.offre_id
              ${joinDateCond}
        GROUP BY o.type_contrat
        ORDER BY total DESC NULLS LAST
        `,
        params
      );
      parTypeContratRows = rows;
    }

    // Répartition par lieu (si colonne existante)
    let parLieuRows = [];
    if (await hasColumn("offres", "lieu")) {
      const { rows } = await pool.query(
        `
        SELECT o.lieu,
               COALESCE(COUNT(c.id), 0)::int AS total
        FROM offres o
        LEFT JOIN candidatures c
               ON o.id = c.offre_id
              ${joinDateCond}
        GROUP BY o.lieu
        ORDER BY total DESC NULLS LAST
        LIMIT 5
        `,
        params
      );
      parLieuRows = rows;
    }

    // Répartition par categorie (si colonne existante)
    let parCategorieRows = [];
    if (await hasColumn("offres", "categorie")) {
      const { rows } = await pool.query(
        `
        SELECT o.categorie,
               COALESCE(COUNT(c.id), 0)::int AS total
        FROM offres o
        LEFT JOIN candidatures c
               ON o.id = c.offre_id
              ${joinDateCond}
        GROUP BY o.categorie
        ORDER BY total DESC NULLS LAST
        `,
        params
      );
      parCategorieRows = rows;
    }

    // Comparaison multi-années (année courante et année+1) sur candidatures
    const nextYear = String(Number(year) + 1);
    const multiYearData = await pool.query(
      `
      SELECT TO_CHAR(date_trunc('month', date_candidature),'MM') AS mois,
             EXTRACT(YEAR FROM date_candidature)::TEXT AS annee,
             COUNT(*)::int AS total
      FROM candidatures
      WHERE EXTRACT(YEAR FROM date_candidature) IN ($1::int, $2::int)
      GROUP BY annee, mois
      ORDER BY annee, mois
      `,
      [year, nextYear]
    );

    res.json({
      total_candidatures: totalCands.rows[0].n,
      total_utilisateurs: totalUsers.rows[0].n,
      total_offres: totalOffres.rows[0].n,
      total_administrateurs: totalAdmins.rows[0].n,
      candidatures_par_mois: candidaturesParMois.rows,
      candidatures_par_offre: candidaturesParOffre.rows,
      par_type_contrat: parTypeContratRows,   // [] si colonne manquante
      par_lieu: parLieuRows,                  // [] si colonne manquante
      par_categorie: parCategorieRows,        // [] si colonne manquante
      multi_year_data: multiYearData.rows,
      year,
      ...(month ? { month } : {}),
    });
  } catch (err) {
    console.error("❌ [ADMIN/STATS/resume] Error:", err);
    res.status(500).json({ error: "STATS_RESUME_FAILED", details: err.message });
  }
}
