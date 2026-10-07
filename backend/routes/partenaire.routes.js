// 📁 routes/partenaire.routes.js
// Espace partenaire (profil, avis de recrutement). Monté sous /backend/partenaire.
import express from "express";
import { requireRole } from "../middlewares/requireRole.js";
import { verifierComptePartenaire } from "../middlewares/comptePartenaire.js";
import { recevoirPieceJointe, verifierPdf } from "../middlewares/uploadAvis.js";
import { recevoirLogo } from "../middlewares/uploadLogoPartenaire.js";
import {
  getMonProfilPartenaire,
  modifierMonProfilPartenaire,
  televerserMonLogo,
  listMesAvis,
  getMonAvis,
  soumettreAvis,
  modifierMonAvis,
} from "../controllers/espacePartenaire.controller.js";

const router = express.Router();

// Rôle, puis état réel du compte (suspension, mot de passe provisoire) pour toutes les routes
router.use(requireRole("partenaire"));
router.use(verifierComptePartenaire);

router.get("/profil", getMonProfilPartenaire);
router.put("/profil", modifierMonProfilPartenaire);
router.post("/logo", recevoirLogo, televerserMonLogo);
router.get("/avis", listMesAvis);
router.get("/avis/:id", getMonAvis);
router.post("/avis", recevoirPieceJointe, verifierPdf, soumettreAvis);
router.put("/avis/:id", recevoirPieceJointe, verifierPdf, modifierMonAvis);

export default router;
