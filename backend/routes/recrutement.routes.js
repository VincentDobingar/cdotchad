// backend/routes/recrutement.routes.js
import express from "express";
import {
  ajouterOffre,
  modifierOffre,
  getOffreById,
  getToutesOffres,
  supprimerOffre,
} from "../controllers/recrutement.controller.js";
import { verifyAdminToken } from "../middlewares/auth.js";
import { uploadOffreFile } from "../middlewares/upload.js";



const router = express.Router();

// 🔒 Obtenir toutes les offres
router.get("/", verifyAdminToken, getToutesOffres);

// 🔒 Obtenir une offre par ID (pour édition)
router.get("/:id", getOffreById); // ✅ plus de middleware

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM offres WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// 🔒 Ajouter une offre (avec fichier PDF)
router.post(
  "/",
  verifyAdminToken,
  uploadOffreFile.fields([
  { name: "document", maxCount: 1 },
  { name: "fichier_joint", maxCount: 1 },
    ]),
  ajouterOffre
);

// 🔒 Modifier une offre (avec fichier PDF)
router.put(
  "/:id",
  verifyAdminToken,
  uploadOffreFile.fields([
    { name: "document", maxCount: 1 },
    { name: "fichier_joint", maxCount: 1 },
  ]),
  modifierOffre
);

// 🔒 Supprimer une offre
router.delete("/:id", verifyAdminToken, supprimerOffre);

export default router;
