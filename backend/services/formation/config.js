// 📁 backend/services/formation/config.js
// Réglages de la plateforme de formation, tous lus dans le .env (aucun secret versionné).
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const nombre = (v, defaut) => (Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : defaut);

export const FORMATION = {
  // URL publique du site (liens dans les e-mails, QR codes des certificats)
  siteUrl: (process.env.PUBLIC_BASE_URL || process.env.BASE_URL || "https://www.cdotchad.com").replace(/\/+$/, ""),
  // URL publique de l'API, vue depuis le serveur BigBlueButton (callbacks)
  apiUrl: (process.env.FORMATION_API_URL || `${(process.env.PUBLIC_BASE_URL || "https://www.cdotchad.com").replace(/\/+$/, "")}/backend`).replace(/\/+$/, ""),

  bbb: {
    // Ex. https://visio.cdotchad.com/bigbluebutton/api (sans barre finale)
    url: (process.env.BBB_URL || "").replace(/\/+$/, ""),
    secret: process.env.BBB_SECRET || "",
    // sha1 | sha256 | sha384 | sha512 (BigBlueButton 3.0 accepte les quatre par défaut)
    checksum: process.env.BBB_CHECKSUM_ALGO || "sha256",
    // Les séances s'ouvrent aux participants N minutes avant l'heure prévue
    ouvertureAvantMinutes: nombre(process.env.FORMATION_OUVERTURE_AVANT_MIN, 30),
  },

  stockage: {
    // local : dossier privé backend/uploads_prives/formations (compatible cPanel)
    // s3    : stockage objet compatible S3 (Backblaze B2, OVHcloud Object Storage...)
    pilote: process.env.FORMATION_STOCKAGE || "local",
    s3: {
      endpoint: process.env.S3_ENDPOINT || "",
      region: process.env.S3_REGION || "eu-west-1",
      bucket: process.env.S3_BUCKET || "",
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    // Durée de validité des liens temporaires (lecture / téléchargement)
    lienMinutes: nombre(process.env.FORMATION_LIEN_MINUTES, 120),
    // Taille maximale d'un replay déposé à la main (Mo)
    replayMaxMo: nombre(process.env.FORMATION_REPLAY_MAX_MO, 2048),
    supportMaxMo: nombre(process.env.FORMATION_SUPPORT_MAX_MO, 50),
    devoirMaxMo: nombre(process.env.FORMATION_DEVOIR_MAX_MO, 20),
  },

  certificat: {
    signataire: process.env.CERTIF_SIGNATAIRE || "La Direction générale",
    fonctionSignataire: process.env.CERTIF_FONCTION || "CDO Consulting Tchad",
    // Images hors dépôt (cf. .gitignore) : chemins absolus ou relatifs au dossier backend
    signatureImage: process.env.CERTIF_SIGNATURE_IMG || "",
    cachetImage: process.env.CERTIF_CACHET_IMG || "",
    logoImage: process.env.CERTIF_LOGO_IMG || "assets/formation/logo-cdotchad.png",
    prefixeNumero: process.env.CERTIF_PREFIXE || "CDO",
  },
};

// Secret des jetons internes (liens temporaires, callbacks BigBlueButton)
const SECRET_INTERNE = process.env.FORMATION_SECRET || process.env.JWT_SECRET || "";

export function signer(valeur) {
  if (!SECRET_INTERNE) throw new Error("FORMATION_SECRET (ou JWT_SECRET) manquant dans le .env");
  return crypto.createHmac("sha256", SECRET_INTERNE).update(String(valeur)).digest("base64url");
}

export function signatureValide(valeur, signature) {
  if (!signature) return false;
  const attendu = Buffer.from(signer(valeur));
  const recu = Buffer.from(String(signature));
  return attendu.length === recu.length && crypto.timingSafeEqual(attendu, recu);
}

export function erreur(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
