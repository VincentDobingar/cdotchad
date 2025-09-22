// ✅ backend/routes/services.routes.js
import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// ✅ GET /api/services — récupérer tous les services
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM services ORDER BY id DESC");
    const rows = result.rows;

    // Optionnel : récupérer les sous-services liés
    for (const service of rows) {
      const sous = await pool.query("SELECT * FROM sous_services WHERE service_id = $1", [service.id]);
      service.sous_services = sous.rows;
    }

    res.json(rows);
  } catch (err) {
    console.error("Erreur GET /services:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ POST /api/services — ajouter un service
router.post("/", async (req, res) => {
  const { titre, description, icone, sous_services } = req.body;
  try {
    const insertRes = await pool.query(
      "INSERT INTO services (titre, description, icone) VALUES ($1, $2, $3) RETURNING id",
      [titre, description, icone]
    );
    const serviceId = insertRes.rows[0].id;

    for (const nom of sous_services) {
      await pool.query(
        "INSERT INTO sous_services (nom, service_id) VALUES ($1, $2)",
        [nom, serviceId]
      );
    }

    res.status(201).json({ message: "Service ajouté." });
  } catch (err) {
    console.error("Erreur POST /services:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ PUT /api/services/:id — modifier un service
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { titre, description, icone, sous_services } = req.body;
  try {
    await pool.query(
      "UPDATE services SET titre=$1, description=$2, icone=$3 WHERE id=$4",
      [titre, description, icone, id]
    );

    await pool.query("DELETE FROM sous_services WHERE service_id = $1", [id]);

    for (const nom of sous_services) {
      await pool.query(
        "INSERT INTO sous_services (nom, service_id) VALUES ($1, $2)",
        [nom, id]
      );
    }

    res.json({ message: "Service mis à jour." });
  } catch (err) {
    console.error("Erreur PUT /services/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ DELETE /api/services/:id — supprimer un service
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM sous_services WHERE service_id = $1", [id]);
    await pool.query("DELETE FROM services WHERE id = $1", [id]);
    res.json({ message: "Service supprimé." });
  } catch (err) {
    console.error("Erreur DELETE /services/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
