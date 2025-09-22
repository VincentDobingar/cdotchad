// 📁 backend/middlewares/verifySuperAdmin.js
import { isSuperAdmin } from "../utils/roles.js";

export const verifySuperAdmin = (req, res, next) => {
  const who = req.admin || {};
  if (!who) return res.status(401).json({ message: "Non authentifié." });
  if (!isSuperAdmin(who)) return res.status(403).json({ message: "Accès réservé au super administrateur." });
  next();
};
