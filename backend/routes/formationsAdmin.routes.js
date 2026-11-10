// 📁 routes/formationsAdmin.routes.js
// Administration de la plateforme de formation. Montée sous /backend/admin/formations.
import express from "express";
import { requireRole } from "../middlewares/requireRole.js";
import { uploadImageFormation, uploadReplay, uploadSupport } from "../middlewares/uploadFormation.js";
import * as c from "../controllers/formationsAdmin.controller.js";

const router = express.Router();
router.use(requireRole("admin", "superadmin"));

// Tableau de bord et journal (avant « /:id »)
router.get("/tableau-de-bord", c.tableauDeBord);
router.get("/journal", c.journal);

// Formations
router.get("/", c.listerFormations);
router.post("/", c.creerFormation);

// Sessions
router.get("/sessions/:id", c.lireSession);
router.put("/sessions/:id", c.modifierSession);
router.delete("/sessions/:id", c.supprimerSession);
router.get("/sessions/:id/export.csv", c.exporterSessionCsv);
router.post("/sessions/:id/seances", c.creerSeance);
router.post("/sessions/:id/inscriptions", c.ajouterParticipant);
router.post("/sessions/:id/supports", uploadSupport, c.ajouterSupport);
router.post("/sessions/:id/evaluations", c.creerEvaluation);
router.get("/sessions/:id/resultats", c.resultatsSession);
router.post("/sessions/:id/resultats/calculer", c.calculerResultats);
router.post("/sessions/:id/resultats/publier", c.publierResultats);
router.post("/sessions/:id/certificats", c.genererCertificats);

// Séances
router.put("/seances/:id", c.modifierSeance);
router.delete("/seances/:id", c.supprimerSeance);
router.post("/seances/:id/demarrer", c.demarrerSeance);
router.post("/seances/:id/terminer", c.terminerSeance);
router.post("/seances/:id/synchroniser-replays", c.synchroniserReplaysSeance);
router.get("/seances/:id/presences", c.presencesSeance);
router.put("/seances/:id/presences", c.saisirPresences);
router.post("/seances/:id/replays", uploadReplay, c.deposerReplay);

// Inscriptions
router.patch("/inscriptions/:id", c.modifierInscription);

// Supports, replays, fichiers
router.delete("/supports/:id", c.supprimerSupport);
router.patch("/replays/:id", c.modifierReplay);
router.delete("/replays/:id", c.supprimerReplay);
router.get("/fichiers/:type/:id/lien", c.lienFichierAdmin);

// Évaluations
router.get("/evaluations/:id", c.lireEvaluationAdmin);
router.put("/evaluations/:id", c.modifierEvaluation);
router.delete("/evaluations/:id", c.supprimerEvaluation);
router.put("/evaluations/:id/questions", c.enregistrerQuestions);
router.patch("/tentatives/:id", c.corrigerTentative);

// Certificats
router.post("/certificats/:id/renvoyer", c.renvoyerCertificat);
router.post("/certificats/:id/revoquer", c.revoquerCertificat);

// Fiche formation (en dernier : « /:id » attrape tout le reste)
router.get("/:id", c.lireFormation);
router.put("/:id", c.modifierFormation);
router.delete("/:id", c.supprimerFormation);
router.post("/:id/sessions", c.creerSession);
router.post("/:id/image", uploadImageFormation, c.televerserImage);
router.delete("/:id/image", c.retirerImage);

export default router;
