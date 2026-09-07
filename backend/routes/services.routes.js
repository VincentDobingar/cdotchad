import express from "express";
import { pool } from "../config/db.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router();

// ✅ GET services + sous-services
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.titre, s.description, s.icone, s.created_at,
             COALESCE(json_agg(json_build_object('id', ss.id, 'nom', ss.nom))
                      FILTER (WHERE ss.id IS NOT NULL), '[]') AS sous_services
      FROM services s
      LEFT JOIN sous_services ss ON ss.service_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur GET /services:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ POST service + sous-services
router.post("/", requireRole("admin", "superadmin"), async (req, res) => {
  const { titre, description, sous_services, icone } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const serviceInsert = await client.query(
      `INSERT INTO services (titre, description, icone)
       VALUES ($1, $2, $3) RETURNING id`,
      [titre, description, icone]
    );
    const serviceId = serviceInsert.rows[0].id;

    for (const nom of sous_services || []) {
      if (nom?.trim()) {
        await client.query(
          `INSERT INTO sous_services (service_id, nom) VALUES ($1, $2)`,
          [serviceId, nom.trim()]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Service ajouté." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erreur POST /services:", err);
    res.status(500).json({ error: "Erreur création" });
  } finally {
    client.release();
  }
});

// ✅ PUT service + sous-services
router.put("/:id", requireRole("admin", "superadmin"), async (req, res) => {
  const { id } = req.params;
  const { titre, description, sous_services, icone } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE services SET titre=$1, description=$2, icone=$3 WHERE id=$4`,
      [titre, description, icone, id]
    );

    await client.query(`DELETE FROM sous_services WHERE service_id = $1`, [id]);

    for (const nom of sous_services || []) {
      if (nom?.trim()) {
        await client.query(
          `INSERT INTO sous_services (service_id, nom) VALUES ($1, $2)`,
          [id, nom.trim()]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Service mis à jour." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erreur PUT /services:", err);
    res.status(500).json({ error: "Erreur mise à jour" });
  } finally {
    client.release();
  }
});

// ✅ DELETE service + cascade
router.delete("/:id", requireRole("admin", "superadmin"), async (req, res) => {
  try {
    await pool.query("DELETE FROM services WHERE id = $1", [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error("Erreur DELETE /services:", err);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

export default router;
