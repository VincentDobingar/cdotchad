// 📁 routes/formations.routes.js
// Plateforme de formation : catalogue public, espace participant, fichiers privés et
// rappels BigBlueButton. Montée sous /backend/formations.
import express from "express";
import { requireRole } from "../middlewares/requireRole.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { uploadDevoir } from "../middlewares/uploadFormation.js";
import { servirJeton } from "../services/formation/stockage.service.js";
import {
  listerCatalogue,
  ficheFormation,
  verifierCertificat,
  inscrire,
  annulerInscription,
  mesFormations,
  detailInscription,
  rejoindreSeance,
  lienSupport,
  lienReplay,
  progressionReplay,
  lireEvaluation,
  soumettreQuiz,
  deposerDevoir,
  lienCertificat,
} from "../controllers/formations.controller.js";
import { rappelFin, rappelEnregistrement, rappelAnalytique } from "../controllers/formationsBbb.controller.js";

const router = express.Router();
const participant = requireRole("candidat", "partenaire");

/* Public */
router.get("/", listerCatalogue);
router.get("/fiche/:slug", optionalAuth, ficheFormation);
router.get("/certificats/verifier/:numero", verifierCertificat);

/* Fichiers privés (lien signé et temporaire, délivré après contrôle des droits) */
router.get("/fichiers/:jeton", servirJeton);

/* Rappels du serveur BigBlueButton (jeton signé dans l'URL) */
router.all("/bbb/fin", rappelFin);
router.post("/bbb/enregistrement-pret", express.urlencoded({ extended: false }), rappelEnregistrement);
router.post("/bbb/analytique", express.json({ limit: "5mb" }), rappelAnalytique);

/* Espace participant */
router.post("/sessions/:id/inscription", participant, inscrire);
router.delete("/sessions/:id/inscription", participant, annulerInscription);
router.get("/espace", participant, mesFormations);
router.get("/espace/inscriptions/:id", participant, detailInscription);
router.post("/espace/seances/:id/rejoindre", participant, rejoindreSeance);
router.get("/espace/supports/:id/lien", participant, lienSupport);
router.get("/espace/replays/:id/lien", participant, lienReplay);
router.post("/espace/replays/:id/progression", participant, progressionReplay);
router.get("/espace/evaluations/:id", participant, lireEvaluation);
router.post("/espace/evaluations/:id/tentatives", participant, soumettreQuiz);
router.post("/espace/evaluations/:id/devoir", participant, uploadDevoir, deposerDevoir);
router.get("/espace/certificats/:id/lien", participant, lienCertificat);

export default router;
