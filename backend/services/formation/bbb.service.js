// 📁 backend/services/formation/bbb.service.js
// Pilotage de BigBlueButton 3.0 par son API : le site crée les salles, génère les liens
// d'entrée personnels et récupère les enregistrements. Le serveur vidéo n'est jamais
// exposé sans un lien délivré par cdotchad.com.
//
// Référence : https://docs.bigbluebutton.org/development/api
//   checksum = hash(nomAppel + chaîneDeRequête + secretPartagé)
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { XMLParser } from "fast-xml-parser";
import { FORMATION, signer, erreur } from "./config.js";

const xml = new XMLParser({ ignoreAttributes: false, parseTagValue: true, trimValues: true });

export const bbbConfigure = () => Boolean(FORMATION.bbb.url && FORMATION.bbb.secret);

// Encodage RFC 3986 strict : fetch() réencode « ' » dans la requête, ce qui fausserait le
// checksum calculé par BigBlueButton sur la chaîne reçue.
const encoder = (s) =>
  encodeURIComponent(String(s)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

function chaine(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encoder(k)}=${encoder(v)}`)
    .join("&");
}

export function urlAppel(appel, params = {}) {
  if (!bbbConfigure()) throw erreur(503, "Le serveur de visioconférence n'est pas configuré (BBB_URL, BBB_SECRET).");
  const requete = chaine(params);
  const checksum = crypto
    .createHash(FORMATION.bbb.checksum)
    .update(appel + requete + FORMATION.bbb.secret)
    .digest("hex");
  return `${FORMATION.bbb.url}/${appel}?${requete ? `${requete}&` : ""}checksum=${checksum}`;
}

async function appeler(appel, params) {
  const reponse = await fetch(urlAppel(appel, params), { signal: AbortSignal.timeout(15000) });
  const texte = await reponse.text();
  const corps = xml.parse(texte)?.response;
  if (!corps) throw erreur(502, `Réponse BigBlueButton illisible (${appel}).`);
  if (corps.returncode !== "SUCCESS") {
    // « notFound » sur getRecordings/getMeetingInfo n'est pas une panne
    if (corps.messageKey === "notFound") return { ...corps, introuvable: true };
    throw erreur(502, `BigBlueButton (${appel}) : ${corps.message || corps.messageKey || "échec"}`);
  }
  return corps;
}

// Jeton propre au site dans les URL de rappel : BigBlueButton ne fait que les recopier,
// on peut donc vérifier l'origine de l'appel sans dépendre de sa version.
export const jetonRappel = (meetingId) => signer(`bbb:${meetingId}`);

export function identifiantSalle(seance) {
  return `cdo-seance-${seance.id}-${crypto.randomBytes(6).toString("hex")}`;
}

/**
 * Crée (ou recrée, l'appel est idempotent côté BBB) la salle d'une séance.
 * Choix « audio d'abord » de l'analyse : caméras des participants coupées par défaut,
 * seules les caméras des formateurs sont diffusées aux participants.
 */
export async function creerSalle({ seance, formationTitre }) {
  const meetingID = seance.bbb_meeting_id;
  const t = jetonRappel(meetingID);
  const base = FORMATION.apiUrl;
  return appeler("create", {
    name: `${formationTitre} — ${seance.titre}`.slice(0, 250),
    meetingID,
    record: "true",
    autoStartRecording: "true",
    allowStartStopRecording: "true",
    duration: seance.duree_minutes + 60, // marge : la salle se ferme d'elle-même ensuite
    welcome: `Bienvenue à la séance « ${seance.titre} ». Micro coupé à l'entrée : levez la main pour intervenir.`,
    muteOnStart: "true",
    webcamsOnlyForModerator: "true",
    lockSettingsDisableCam: seance.cameras_participants ? "false" : "true",
    logoutURL: `${FORMATION.siteUrl}/mes-formations`,
    "meta_bbb-origin": "cdotchad.com",
    "meta_seance-id": seance.id,
    "meta_bbb-recording-ready-url": `${base}/formations/bbb/enregistrement-pret?t=${t}`,
    meta_endCallbackUrl: `${base}/formations/bbb/fin?t=${t}&meetingID=${encodeURIComponent(meetingID)}`,
    "meta_analytics-callback-url": `${base}/formations/bbb/analytique?t=${t}&meetingID=${encodeURIComponent(meetingID)}`,
  });
}

/** Lien d'entrée personnel (non partageable durablement : la salle n'existe que le temps du direct). */
export function lienEntree({ meetingID, nom, userId, moderateur }) {
  return urlAppel("join", {
    meetingID,
    fullName: (nom || "Participant").slice(0, 100),
    role: moderateur ? "MODERATOR" : "VIEWER",
    userID: `cdo-${userId}`,
    redirect: "true",
    "userdata-bbb_auto_share_webcam": "false",
    "userdata-bbb_skip_video_preview": "true",
  });
}

export async function salleActive(meetingID) {
  const r = await appeler("isMeetingRunning", { meetingID });
  return String(r.running) === "true";
}

export async function terminerSalle(meetingID) {
  // BBB 3.0 n'exige plus le mot de passe modérateur pour « end »
  return appeler("end", { meetingID });
}

/** Liste normalisée des enregistrements d'une salle. */
export async function listerEnregistrements(meetingID) {
  const r = await appeler("getRecordings", { meetingID, state: "published,processing,processed,unpublished" });
  if (r.introuvable) return [];
  const brut = r.recordings?.recording;
  const liste = Array.isArray(brut) ? brut : brut ? [brut] : [];
  return liste.map((rec) => {
    const formats = rec.playback?.format;
    const tab = Array.isArray(formats) ? formats : formats ? [formats] : [];
    return {
      recordId: rec.recordID,
      etat: rec.state,
      debut: rec.startTime ? new Date(Number(rec.startTime)) : null,
      fin: rec.endTime ? new Date(Number(rec.endTime)) : null,
      formats: tab.map((f) => ({ type: f.type, url: f.url, dureeMinutes: Number(f.length) || null })),
    };
  });
}

/**
 * URL du fichier vidéo produit par le format « video » de BigBlueButton (à activer sur le
 * serveur : bbb-playback-video). La page de lecture est …/playback/video/<id>/ ; le fichier
 * est …/presentation/<id>/video-0.m4v.
 */
export function urlFichierVideo(format, recordId) {
  if (!format?.url) return null;
  try {
    const u = new URL(format.url);
    return `${u.origin}/presentation/${recordId}/video-0.m4v`;
  } catch {
    return null;
  }
}

/**
 * Vérifie le paramètre « signed_parameters » envoyé par BigBlueButton au rappel
 * « recording-ready » : un JWT (HS256) signé avec le secret partagé.
 */
export function lireParametresSignes(signed) {
  if (!signed) return null;
  try {
    return jwt.verify(signed, FORMATION.bbb.secret, { algorithms: ["HS256", "HS384", "HS512"] });
  } catch {
    return null;
  }
}
