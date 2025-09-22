import { Parser } from "json2csv"; // Assure-toi d’avoir installé ce package

router.get("/export-csv", async (req, res) => {
  const { offre, date_min, date_max } = req.query;

  const conditions = [];
  const values = [];

  if (offre) {
    values.push(`%${offre.toLowerCase()}%`);
    conditions.push(`LOWER(o.titre) LIKE $${values.length}`);
  }

  if (date_min) {
    values.push(date_min);
    conditions.push(`c.date_candidature >= $${values.length}`);
  }

  if (date_max) {
    values.push(date_max);
    conditions.push(`c.date_candidature <= $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `SELECT c.nom, c.email, c.telephone, o.titre AS offre, c.date_candidature
       FROM candidatures c
       LEFT JOIN offres o ON c.offre_id = o.id
       ${whereClause}
       ORDER BY c.date_candidature DESC`,
      values
    );

    const parser = new Parser();
    const csv = parser.parse(result.rows);

    res.header("Content-Type", "text/csv");
    res.attachment("candidatures.csv");
    res.send(csv);
  } catch (err) {
    console.error("Erreur export CSV :", err);
    res.status(500).json({ error: "Erreur export CSV" });
  }
});
