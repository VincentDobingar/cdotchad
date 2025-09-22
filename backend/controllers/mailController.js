import nodemailer from "nodemailer";

export const envoyerConfirmation = async (req, res) => {
  const { email, nom, poste } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: `Confirmation de votre candidature à ${poste}`,
    html: `<p>Bonjour ${nom},<br>Votre candidature au poste de <strong>${poste}</strong> a bien été reçue.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur email :", err);
    res.status(500).json({ success: false });
  }
};
