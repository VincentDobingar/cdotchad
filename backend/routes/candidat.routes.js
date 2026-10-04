// 📁 routes/candidat.routes.js
// Espace candidat (profil + documents enregistrés). Montée sous /backend/candidat.
import express from "express";
import { requireRole } from "../middlewares/requireRole.js";
import { uploadDocumentCandidat } from "../middlewares/uploadDocumentCandidat.js";
import {
  getMonProfil,
  updateMonProfil,
  listMesDocuments,
  ajouterMonDocument,
  telechargerMonDocument,
  supprimerMonDocument,
} from "../controllers/candidat.controller.js";

const router = express.Router();

// Toutes les routes de l'espace candidat exigent un compte candidat connecté
router.use(requireRole("candidat"));

router.get("/profil", getMonProfil);
router.put("/profil", updateMonProfil);

router.get("/documents", listMesDocuments);

// Les erreurs multer (taille, format) deviennent des 400 lisibles par le frontend
router.post(
  "/documents",
  (req, res, next) =>
    uploadDocumentCandidat(req, res, (err) => {
      if (err) {
        const message =
          err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (5 Mo maximum)." : err.message;
        return res.status(400).json({ message });
      }
      next();
    }),
  ajouterMonDocument
);
router.get("/documents/:id/telecharger", telechargerMonDocument);
router.delete("/documents/:id", supprimerMonDocument);

export default router;
