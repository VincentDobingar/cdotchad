// 📁 backend/services/formation/stockage.service.js
// Stockage privé des replays, supports, devoirs et certificats.
//
//  - pilote « local » : backend/uploads_prives/formations/… (hors du dossier statique,
//    fonctionne sur l'hébergement cPanel actuel) ; les fichiers sont servis par l'API,
//    uniquement via un lien signé à durée limitée.
//  - pilote « s3 » : stockage objet compatible S3 (Backblaze B2, OVHcloud), bucket privé ;
//    le lien temporaire est une URL pré-signée.
//
// Dans les deux cas, aucun lien permanent n'existe : chaque lien est délivré après
// contrôle des droits et journalisé par l'appelant.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { fileURLToPath } from "url";
import { pool } from "../../config/db.js";
import { FORMATION, signer, signatureValide, erreur } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RACINE_LOCALE = path.join(__dirname, "..", "..", "uploads_prives", "formations");
export const DOSSIER_TEMP = path.join(RACINE_LOCALE, "_tmp");
fs.mkdirSync(DOSSIER_TEMP, { recursive: true });

const pilote = () => (FORMATION.stockage.pilote === "s3" ? "s3" : "local");

let clientS3 = null;
async function s3() {
  if (clientS3) return clientS3;
  const cfg = FORMATION.stockage.s3;
  if (!cfg.bucket || !cfg.accessKeyId) throw erreur(503, "Stockage S3 non configuré (S3_BUCKET, S3_ACCESS_KEY_ID...).");
  let mod, presign;
  try {
    mod = await import("@aws-sdk/client-s3");
    presign = await import("@aws-sdk/s3-request-presigner");
  } catch {
    throw erreur(503, "Paquets @aws-sdk/client-s3 et @aws-sdk/s3-request-presigner absents : npm install.");
  }
  const client = new mod.S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint || undefined,
    forcePathStyle: Boolean(cfg.endpoint),
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  clientS3 = { client, mod, getSignedUrl: presign.getSignedUrl, bucket: cfg.bucket };
  return clientS3;
}

function nouvelleCle(dossier, nomOriginal) {
  const ext = path.extname(nomOriginal || "").toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 10);
  const jour = new Date().toISOString().slice(0, 7);
  return `${dossier}/${jour}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
}

function cheminLocal(cle) {
  const complet = path.resolve(RACINE_LOCALE, cle);
  if (!complet.startsWith(path.resolve(RACINE_LOCALE) + path.sep)) throw erreur(400, "Clé de fichier invalide.");
  return complet;
}

async function inserer({ cle, nomOriginal, typeMime, taille }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO formation_fichiers (pilote, cle, nom_original, type_mime, taille_octets)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [pilote(), cle, nomOriginal || null, typeMime || null, taille ?? null]
  );
  return rows[0];
}

/** Range un fichier temporaire (multer, téléchargement) dans le stockage privé. */
export async function enregistrerFichier({ cheminTemp, nomOriginal, typeMime, dossier }) {
  const cle = nouvelleCle(dossier, nomOriginal);
  const taille = fs.statSync(cheminTemp).size;
  try {
    if (pilote() === "local") {
      const cible = cheminLocal(cle);
      fs.mkdirSync(path.dirname(cible), { recursive: true });
      try {
        fs.renameSync(cheminTemp, cible);
      } catch {
        fs.copyFileSync(cheminTemp, cible);
      }
    } else {
      const { client, mod, bucket } = await s3();
      await client.send(
        new mod.PutObjectCommand({
          Bucket: bucket,
          Key: cle,
          Body: fs.createReadStream(cheminTemp),
          ContentLength: taille,
          ContentType: typeMime || "application/octet-stream",
        })
      );
    }
  } finally {
    fs.rm(cheminTemp, { force: true }, () => {});
  }
  return inserer({ cle, nomOriginal, typeMime, taille });
}

/** Range un contenu en mémoire (certificat PDF généré). */
export async function enregistrerTampon({ tampon, nomOriginal, typeMime, dossier }) {
  const temp = path.join(DOSSIER_TEMP, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`);
  fs.writeFileSync(temp, tampon);
  return enregistrerFichier({ cheminTemp: temp, nomOriginal, typeMime, dossier });
}

/** Télécharge une URL (fichier vidéo BigBlueButton) puis la range dans le stockage privé. */
export async function importerDepuisUrl({ url, nomOriginal, typeMime, dossier }) {
  const reponse = await fetch(url, { signal: AbortSignal.timeout(60 * 60 * 1000) });
  if (!reponse.ok || !reponse.body) throw erreur(502, `Téléchargement impossible (${reponse.status}) : ${url}`);
  const temp = path.join(DOSSIER_TEMP, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`);
  await pipeline(Readable.fromWeb(reponse.body), fs.createWriteStream(temp));
  return enregistrerFichier({ cheminTemp: temp, nomOriginal, typeMime, dossier });
}

export async function supprimerFichier(fichier) {
  if (!fichier) return;
  try {
    if (fichier.pilote === "local") fs.rmSync(cheminLocal(fichier.cle), { force: true });
    else {
      const { client, mod, bucket } = await s3();
      await client.send(new mod.DeleteObjectCommand({ Bucket: bucket, Key: fichier.cle }));
    }
  } catch (err) {
    console.error("Suppression fichier formation :", err.message);
  }
  await pool.query("DELETE FROM formation_fichiers WHERE id = $1", [fichier.id]);
}

export async function lireFichier(id) {
  const { rows } = await pool.query("SELECT * FROM formation_fichiers WHERE id = $1", [id]);
  return rows[0] || null;
}

const nomTelechargement = (f) =>
  (f.nom_original || `fichier${path.extname(f.cle)}`).replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 150);

/**
 * Lien temporaire personnel vers un fichier privé.
 * @param {object} fichier ligne formation_fichiers
 * @param {{ telecharger?: boolean, userId: number }} options
 */
export async function lienTemporaire(fichier, { telecharger = false, userId }) {
  const minutes = FORMATION.stockage.lienMinutes;
  if (fichier.pilote === "s3") {
    const { client, mod, getSignedUrl, bucket } = await s3();
    const nom = encodeURIComponent(nomTelechargement(fichier));
    const commande = new mod.GetObjectCommand({
      Bucket: bucket,
      Key: fichier.cle,
      ResponseContentDisposition: `${telecharger ? "attachment" : "inline"}; filename*=UTF-8''${nom}`,
    });
    return { url: await getSignedUrl(client, commande, { expiresIn: minutes * 60 }), expire_dans_minutes: minutes };
  }
  const expire = Math.floor(Date.now() / 1000) + minutes * 60;
  const charge = `${fichier.id}.${expire}.${telecharger ? 1 : 0}.${userId}`;
  return { url: `/backend/formations/fichiers/${charge}.${signer(`f:${charge}`)}`, expire_dans_minutes: minutes };
}

/** Sert un fichier local à partir d'un jeton signé (gère les requêtes partielles pour la vidéo). */
export async function servirJeton(req, res) {
  const morceaux = String(req.params.jeton || "").split(".");
  if (morceaux.length !== 5) throw erreur(404, "Lien invalide.");
  const [id, expire, dl, uid, sig] = morceaux;
  const charge = `${id}.${expire}.${dl}.${uid}`;
  if (!signatureValide(`f:${charge}`, sig)) throw erreur(404, "Lien invalide.");
  if (Number(expire) < Date.now() / 1000) throw erreur(410, "Ce lien a expiré : rouvrez la page pour en obtenir un nouveau.");

  const fichier = await lireFichier(Number(id));
  if (!fichier || fichier.pilote !== "local") throw erreur(404, "Fichier introuvable.");
  const chemin = cheminLocal(fichier.cle);
  if (!fs.existsSync(chemin)) throw erreur(404, "Fichier introuvable.");

  const nom = nomTelechargement(fichier);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader(
    "Content-Disposition",
    `${dl === "1" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(nom)}`
  );
  if (fichier.type_mime) res.type(fichier.type_mime);
  // sendFile gère « Range » : la vidéo peut être lue et déplacée sans tout télécharger
  await new Promise((resolve, reject) =>
    res.sendFile(chemin, { cacheControl: false, lastModified: false, dotfiles: "deny" }, (err) =>
      err && !res.headersSent ? reject(err) : resolve()
    )
  );
}
