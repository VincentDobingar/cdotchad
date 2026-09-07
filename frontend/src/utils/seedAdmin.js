import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

export const createSuperAdmin = async () => {
  const email = "superadmin@cdotchad.com";
  const password = await bcrypt.hash("admin123", 10);

  const existing = await pool.query("SELECT * FROM administrateurs WHERE email = $1", [email]);
  if (existing.rowCount > 0) return;

  await pool.query(
    "INSERT INTO administrateurs (email, motdepasse, role, cree_le) VALUES ($1, $2, $3, NOW())",
    [email, password, "superAdmin"]
  );
};
