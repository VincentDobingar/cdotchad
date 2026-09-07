// routes/utilisateurs.routes.js
// Gestion administrative des comptes candidats. L'inscription/connexion candidat
// canonique vit sous /backend/auth (register/login), pas ici.
import express from 'express';
import { requireRole } from "../middlewares/requireRole.js";

import {
  getUtilisateurs,
  getUtilisateurById,
  ajouterUtilisateur,
  modifierUtilisateur,
  supprimerUtilisateur,
  getProfilUtilisateur,
  updateMe,
  changeMyPassword
} from '../controllers/utilisateurs.controller.js';

const router = express.Router();

// Admin-protected routes
router.get('/', requireRole("admin", "superadmin"), getUtilisateurs);
router.get('/:id', requireRole("admin", "superadmin"), getUtilisateurById);
router.post('/', requireRole("admin", "superadmin"), ajouterUtilisateur);
router.put('/:id', requireRole("admin", "superadmin"), modifierUtilisateur);
router.delete('/:id', requireRole("admin", "superadmin"), supprimerUtilisateur);

// User-protected routes
router.put('/me', requireRole("candidat"), updateMe);
router.put('/me/password', requireRole("candidat"), changeMyPassword);

// Protected profile
router.get("/profil", requireRole("candidat"), getProfilUtilisateur);

export default router;
