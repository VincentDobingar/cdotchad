// 📁 routes/partenaires.routes.js
// Gestion des comptes partenaires par l'admin. Monté sous /backend/partenaires.
import express from "express";
import { requireRole } from "../middlewares/requireRole.js";
import {
  listPartenaires,
  creerPartenaire,
  reinitialiserMotDePasse,
  supprimerPartenaire,
} from "../controllers/partenaires.controller.js";

const router = express.Router();

router.use(requireRole("admin", "superadmin"));

router.get("/", listPartenaires);
router.post("/", creerPartenaire);
router.post("/:id/reinitialiser-mot-de-passe", reinitialiserMotDePasse);
router.delete("/:id", supprimerPartenaire);

export default router;
