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

export const envoyerEmailAdmin = async ({ nom, email, telephone, commentaire, offreTitre, cv_path, lettre_path, diplome_path, pdfBuffer }) => {
  const mail = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_ADMIN,
    subject: `Nouvelle candidature pour : ${offreTitre}`,
    html: `
      <h2>Nouvelle candidature reçue</h2>
      <p><strong>Nom :</strong> ${nom}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Téléphone :</strong> ${telephone}</p>
      <p><strong>Poste :</strong> ${offreTitre}</p>
      <p><strong>Commentaire :</strong> ${commentaire || "-"}</p>
      <p><strong>CV :</strong> <a href="https://cdotchad.com/${cv_path}">Voir</a></p>
      <p><strong>Lettre :</strong> <a href="https://cdotchad.com/${lettre_path}">Voir</a></p>
      <p><strong>Diplôme :</strong> <a href="https://cdotchad.com/${diplome_path}">Voir</a></p>
    `,
      attachments: [
      { filename: "CV.pdf", path: cv_path },
      { filename: "Lettre.pdf", path: lettre_path },
      { filename: "Diplome.pdf", path: diplome_path },
      {
        filename: `Candidature_${nom}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };
  await transporter.sendMail(mail);
};

export const envoyerEmailCandidat = async ({ nom, email, offreTitre }) => {
  const mail = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Confirmation de votre candidature / Application Received – : ${offreTitre}`,
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px;">
        <p>Bonjour <strong>${nom}</strong>,</p>
        <p>Nous avons bien reçu votre candidature pour le poste <strong>${offreTitre}</strong>.</p>
        <p>Notre équipe va l'examiner avec attention. Merci de l’intérêt que vous portez à notre organisation.</p>
        <br />
        <p><strong>Hello ${nom},</strong></p>
        <p>We have received your application for the position <strong>${offreTitre}</strong>.</p>
        <p>Our team will review it carefully. Thank you for your interest in our organization.</p>
        <br />
        <p style="font-size: 14px; color: #555;">Bien cordialement / Best regards,<br><strong>L’équipe CDO Tchad</strong></p>
      </div>
    `
  };
  await transporter.sendMail(mail);
};
