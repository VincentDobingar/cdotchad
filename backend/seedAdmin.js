// 📁 utils/seedAdmin.js
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

// ✅ Crée un super administrateur si aucun n’existe
export const createSuperAdmin = async () => {
  const email = "superadmin@cdotchad.com";
  const motdepasse = "superadmin123"; // 🔒 Change ce mot de passe après la 1re connexion

  try {
    const existing = await pool.query(
      "SELECT * FROM administrateurs WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      console.log("✅ Super admin déjà existant.");
      return;
    }

    const hashedPassword = await bcrypt.hash(motdepasse, 10);
    await pool.query(
      `INSERT INTO administrateurs (email, motdepasse, role) VALUES ($1, $2, $3)`,
      [email, hashedPassword, "superAdmin"]
    );

    console.log("🚀 Super admin créé avec succès !");
    console.log(`📧 Email : ${email}`);
    console.log(`🔑 Mot de passe : ${motdepasse}`);
  } catch (err) {
    console.error("❌ Erreur création super admin :", err.message);
  }
};
