// 📁 services/email.service.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || "mail.cdotchad.com",
  port: parseInt(process.env.EMAIL_SMTP_PORT || "465"),
  secure: process.env.EMAIL_SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 📩 Mail vers l’administrateur
 */
export function buildAdminMailOptions({ nom, email, message }) {
  return {
    from: `"CDO TCHAD" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_ADMIN,
    subject: "📩 Nouveau message de contact",
    html: `
      <p><strong>Nom :</strong> ${nom}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Message :</strong><br>${message.replace(/\n/g, "<br>")}</p>
    `,
  };
}

/**
 * 📩 Mail de confirmation pour l'utilisateur
 */
export function buildClientMailOptions({ nom, email }) {
  return {
    from: `"CDO TCHAD" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "✅ Accusé de réception - CDO TCHAD",
    html: `
      <p>Bonjour <strong>${nom}</strong>,</p>
      <p>Nous avons bien reçu votre message. Merci de nous avoir contactés !</p>
      <p>L’équipe CDO TCHAD vous répondra dans les plus brefs délais.</p>
      <br>
      <p>Bien cordialement,</p>
      <p><strong>CDO TCHAD</strong></p>
    `,
  };
}
