// ~/public_html/backend/routes/adminAuth.js (ou controllers selon l'arbo)
import express from "express";
import bcrypt from "../lib/bcryptAdapter.js";     // <- ton adaptateur (compare/hash)
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
// Corrige le chemin si besoin (ex.: "../middleware/authAdmin.js")
import { verifyAdminToken } from "../middleware/authAdmin.js";

const router = express.Router();

// Exemple de route protégée
router.get("/admin/candidatures", verifyAdminToken, (req, res) => {
  res.json({ ok: true });
});

// Connexion admin
router.post("/login", async (req, res) => {
  const { email, motdepasse } = req.body;

  try {
    // 1) Récupérer l'utilisateur
    const { rows } = await pool.query(
      "SELECT id, email, role, motdepasse FROM administrateurs WHERE email = $1 LIMIT 1",
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    const admin = rows[0];

    // 2) Comparer le mot de passe en clair avec le hash stocké
    // -> C'est ici qu'on intègre la ligne que tu cites :
    const ok = await bcrypt.compare(motdepasse, admin.motdepasse);
    if (!ok) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // 3) Générer le JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4) Réponse
    res.json({
      token,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error("Erreur /login admin:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
