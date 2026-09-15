// 📁 backend/middlewares/optionalAuth.js
// Décode le Bearer JWT s'il est présent et valide (req.user = {id, email, role}),
// sans jamais bloquer la requête : contrairement à requireRole(), une candidature
// doit pouvoir rester anonyme si personne n'est connecté.
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function optionalAuth(req, _res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET);
      req.user = { id: payload.id, email: payload.email, role: payload.role };
    } catch {
      // Token invalide/expiré : on ignore, la candidature reste anonyme.
    }
  }
  next();
}
