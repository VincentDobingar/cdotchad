// 📁 backend/routes/notifications.routes.js
// Notifications de l'utilisateur connecté, quel que soit son rôle. Monté sous /backend/notifications.
import express from "express";
import { requireRole } from "../middlewares/requireRole.js";
import {
  listMesNotifications,
  marquerLue,
  marquerToutesLues,
} from "../controllers/notifications.controller.js";

const router = express.Router();

// requireRole() sans argument : il suffit d'être connecté
router.use(requireRole());

router.get("/", listMesNotifications);
router.post("/tout-lire", marquerToutesLues);
router.patch("/:id/lue", marquerLue);

export default router;
