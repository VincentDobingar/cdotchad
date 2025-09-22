import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({

  host: "mail.cdotchad.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

async function main() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_ADMIN,
      subject: "✅ Test SMTP réussi depuis le backend CDO",
      html: "<p>Ceci est un test automatique Nodemailer depuis <strong>cdotchad.com</strong></p>",
    });

    console.log("✅ Email envoyé :", info.messageId);
  } catch (err) {
    console.error("❌ Erreur SMTP :", err);
  }
}

main();
