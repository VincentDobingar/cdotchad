// 📁 middlewares/verifyUserToken.js
import jwt from "jsonwebtoken";

export function verifyUserToken(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ")
      ? auth.slice(7)
      : (req.cookies?.userToken || null);

    if (!token) return res.status(401).json({ message: "Token utilisateur manquant" });

    const SECRET = process.env.JWT_SECRET || process.env.USER_JWT_SECRET || "devsecret";
    const d = jwt.verify(token, SECRET);

    req.utilisateur = { id: d.id || d.userId, email: d.email || null, role: d.role || "user" };
    next();
  } catch (e) {
    res.status(401).json({ message: e?.name || "Token invalide" });
  }
}
export default verifyUserToken;
