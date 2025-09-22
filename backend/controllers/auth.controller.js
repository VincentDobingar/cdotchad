import jwt from "jsonwebtoken";
import bcrypt from "../lib/bcryptAdapter.js";
// ⚠️ selon ton db.js : si tu exportes `export const pool = ...` => importe nommé
import { pool } from "../config/db.js"; // ou `import pool from ...` si export default

export async function loginAdmin(req, res) {
  const { email, motdepasse } = req.body;

  try {
    // Récupération de l’admin
    const { rows } = await pool.query(
      "SELECT id, email, role, motdepasse FROM administrateurs WHERE email = $1 LIMIT 1",
      [email]
    );
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ message: "Email invalide" });
    }

    // ➜ Intégration exacte de la logique `compare(plain, hash)`
    const ok = await bcrypt.compare(motdepasse, admin.motdepasse);
    if (!ok) {
      return res.status(401).json({ message: "Mot de passe invalide" });
    }

    // Génération du token JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role ?? "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error("loginAdmin error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}
