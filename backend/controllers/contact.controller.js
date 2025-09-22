// 📁 controllers/contact.controller.js
import dotenv from "dotenv";
import fetch from "node-fetch";
import {
  transporter,
  buildAdminMailOptions,
  buildClientMailOptions,
} from "../services/email.service.js";
import { enregistrerMessage } from "../services/contact.service.js";

dotenv.config();

export const envoyerMessageContact = async (req, res) => {
  const { user_name, user_email, message, recaptchaToken } = req.body;

  if (!user_name || !user_email || !message || !recaptchaToken) {
    return res.status(400).json({ message: "Champs manquants." });
  }

  // ✅ Étape 1 : Vérification reCAPTCHA
  try {
    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.success || verifyData.score < 0.5) {
      return res.status(403).json({ message: "Échec vérification reCAPTCHA.", score: verifyData.score });
    }

    console.log("✅ Résultat reCAPTCHA :", verifyData);
  } catch (err) {
    console.error("❌ Erreur reCAPTCHA :", err);
    return res.status(500).json({ message: "Erreur reCAPTCHA", error: err.message });
  }

  // ✅ Étape 2 : Envoi mails + enregistrement
  try {
    console.log("✅ Envoi message en cours :", { user_name, user_email, message });

    // Envoi à l'admin
    try {
      await transporter.sendMail(
        buildAdminMailOptions({ nom: user_name, email: user_email, message })
      );
      console.log("✅ Mail envoyé à l'admin");
    } catch (err) {
      console.error("❌ Erreur envoi mail admin :", err);
      return res.status(500).json({ message: "Erreur envoi mail admin", error: err.message });
    }

    // Envoi à l'utilisateur
    try {
      await transporter.sendMail(
        buildClientMailOptions({ nom: user_name, email: user_email })
      );
      console.log("✅ Mail envoyé à l'utilisateur");
    } catch (err) {
      console.error("❌ Erreur envoi mail utilisateur :", err);
      return res.status(500).json({ message: "Erreur envoi mail utilisateur", error: err.message });
    }

    // Sauvegarde du message
    try {
      await enregistrerMessage({ nom: user_name, email: user_email, message });
      console.log("✅ Message enregistré en base");
    } catch (err) {
      console.error("❌ Erreur enregistrement message :", err);
      return res.status(500).json({ message: "Erreur enregistrement en base", error: err.message });
    }

    return res.status(200).json({ message: "Message envoyé avec succès." });

  } catch (error) {
    console.error("❌ Erreur globale :", error);
    return res.status(500).json({
      message: "Erreur serveur lors de l’envoi global",
      error: error.message || "Erreur inconnue",
    });
  }
};
