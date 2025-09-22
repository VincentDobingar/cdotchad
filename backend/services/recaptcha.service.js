// 📁 services/recaptcha.service.js
import fetch from "node-fetch";

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

export const verifierReCAPTCHA = async (token) => {
  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`,
    {
      method: "POST",
    }
  );
  const data = await response.json();
  return data;
};
