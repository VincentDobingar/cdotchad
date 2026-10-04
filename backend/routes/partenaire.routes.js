// 📁 routes/partenaire.routes.js
// Espace partenaire (profil, avis de recrutement). Monté sous /backend/partenaire.
import express from "express";
import { requireRole } from "../middlewares/requireRole.js";
import {
  getMonProfilPartenaire,
  listMesAvis,
  getMonAvis,
  soumettreAvis,
  modifierMonAvis,
} from "../controllers/espacePartenaire.controller.js";

const router = express.Router();

router.use(requireRole("partenaire"));

router.get("/profil", getMonProfilPartenaire);
router.get("/avis", listMesAvis);
router.get("/avis/:id", getMonAvis);
router.post("/avis", soumettreAvis);
router.put("/avis/:id", modifierMonAvis);

export default router;
