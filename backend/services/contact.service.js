// 📁 services/contact.service.js
import { pool } from "../config/db.js";

export const enregistrerMessage = async ({ nom, email, sujet, message }) => {
  const query = `
    INSERT INTO messages_contact (nom, email, sujet, message, date_envoi)
    VALUES ($1, $2, $3, $4, NOW())
  `;
  const values = [nom, email, sujet, message];
  await pool.query(query, values);
};