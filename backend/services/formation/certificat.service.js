// 📁 backend/services/formation/certificat.service.js
// Certificat PDF aux couleurs de CDO Tchad (nom, formation, dates, durée, note, signature
// et cachet numérisés, numéro unique) avec un QR code vers la page publique de vérification.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import { FORMATION } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RACINE_BACKEND = path.join(__dirname, "..", "..");

const ROUGE = "#c8102e";
const ENCRE = "#1b1410";
const GRAPHITE = "#4a423c";
const SABLE = "#efe7db";

const image = (p) => {
  if (!p) return null;
  const complet = path.isAbsolute(p) ? p : path.join(RACINE_BACKEND, p);
  return fs.existsSync(complet) ? complet : null;
};

const dateFr = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Ndjamena" }) : null;

export function nouveauNumero(inscriptionId) {
  const annee = new Date().getFullYear();
  const alea = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${FORMATION.certificat.prefixeNumero}-${annee}-${String(inscriptionId).padStart(6, "0")}-${alea}`;
}

export const urlVerification = (numero) => `${FORMATION.siteUrl}/certificats/verifier/${encodeURIComponent(numero)}`;

/**
 * @returns {Promise<Buffer>}
 */
export async function genererCertificatPDF({ numero, participant, formation, session, noteFinale, presencePct, delivreLe }) {
  const qr = await QRCode.toBuffer(urlVerification(numero), { margin: 1, width: 300, color: { dark: ENCRE, light: "#ffffff" } });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0, info: { Title: `Certificat ${numero}`, Author: "CDO Consulting Tchad" } });
    const morceaux = [];
    doc.on("data", (c) => morceaux.push(c));
    doc.on("end", () => resolve(Buffer.concat(morceaux)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;

    // Cadre
    doc.rect(0, 0, W, H).fill("#ffffff");
    doc.rect(18, 18, W - 36, H - 36).lineWidth(1.2).stroke(SABLE);
    doc.rect(28, 28, W - 56, H - 56).lineWidth(3).stroke(ROUGE);
    doc.rect(28, 28, 10, H - 56).fill(ROUGE);

    const logo = image(FORMATION.certificat.logoImage);
    if (logo) doc.image(logo, 70, 52, { height: 62 });

    doc.fillColor(GRAPHITE).font("Helvetica").fontSize(9)
      .text(`N° ${numero}`, W - 300, 62, { width: 230, align: "right" });

    doc.fillColor(ROUGE).font("Helvetica-Bold").fontSize(12)
      .text("CERTIFICAT DE FORMATION", 0, 140, { width: W, align: "center", characterSpacing: 3 });

    doc.fillColor(GRAPHITE).font("Helvetica").fontSize(13)
      .text("CDO Consulting Tchad certifie que", 0, 180, { width: W, align: "center" });

    const nom = [participant.prenom, participant.nom].filter(Boolean).join(" ") || participant.email;
    doc.fillColor(ENCRE).font("Times-Bold").fontSize(34).text(nom, 60, 205, { width: W - 120, align: "center" });

    doc.fillColor(GRAPHITE).font("Helvetica").fontSize(13)
      .text("a suivi avec succès la formation", 0, 258, { width: W, align: "center" });
    doc.fillColor(ENCRE).font("Times-Bold").fontSize(22)
      .text(formation.titre, 90, 282, { width: W - 180, align: "center" });

    const debut = dateFr(session.date_debut);
    const fin = dateFr(session.date_fin);
    const periode = debut && fin && debut !== fin ? `du ${debut} au ${fin}` : debut ? `le ${debut}` : null;
    const details = [
      session.intitule,
      periode,
      formation.duree_heures ? `durée : ${Number(formation.duree_heures).toLocaleString("fr-FR")} heures` : null,
      noteFinale != null ? `note finale : ${Number(noteFinale).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : null,
      presencePct != null ? `présence : ${Math.round(Number(presencePct))} %` : null,
    ].filter(Boolean).join("  ·  ");
    doc.fillColor(GRAPHITE).font("Helvetica").fontSize(11).text(details, 70, doc.y + 12, { width: W - 140, align: "center" });

    // Bas de page : date et lieu, signature, cachet, QR code
    const bas = H - 165;
    doc.fillColor(GRAPHITE).font("Helvetica").fontSize(11)
      .text(`Fait à N'Djamena, le ${dateFr(delivreLe || new Date())}`, 70, bas, { width: 260 });

    const signature = image(FORMATION.certificat.signatureImage);
    if (signature) doc.image(signature, 90, bas + 22, { height: 55 });
    doc.moveTo(70, bas + 90).lineTo(300, bas + 90).lineWidth(0.8).stroke(GRAPHITE);
    doc.fillColor(ENCRE).font("Helvetica-Bold").fontSize(10).text(FORMATION.certificat.signataire, 70, bas + 96, { width: 230 });
    doc.fillColor(GRAPHITE).font("Helvetica").fontSize(9).text(FORMATION.certificat.fonctionSignataire, 70, doc.y + 1, { width: 230 });

    const cachet = image(FORMATION.certificat.cachetImage);
    if (cachet) doc.image(cachet, W / 2 - 55, bas, { width: 110 });

    doc.image(qr, W - 175, bas - 10, { width: 100 });
    doc.fillColor(GRAPHITE).font("Helvetica").fontSize(7.5)
      .text("Vérifiez ce certificat :", W - 205, bas + 94, { width: 160, align: "center" })
      .text(urlVerification(numero).replace(/^https?:\/\//, ""), W - 235, doc.y + 1, { width: 190, align: "center" });

    doc.end();
  });
}
