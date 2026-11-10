// 📁 backend/services/formation/replays.service.js
// Import des enregistrements BigBlueButton dans le stockage privé (§04 de l'analyse) :
// à la fin du direct, BBB traite l'enregistrement puis prévient le site ; le site récupère
// la vidéo MP4 et la dépose dans le stockage privé, jamais dans un dossier public.
import { pool } from "../../config/db.js";
import { listerEnregistrements, urlFichierVideo } from "./bbb.service.js";
import { importerDepuisUrl } from "./stockage.service.js";
import { creerNotification } from "../../controllers/notifications.controller.js";

const enCours = new Set();

async function dateExpiration(seanceId) {
  const { rows: [r] } = await pool.query(
    `SELECT s.conservation_replays_jours FROM formation_seances se
       JOIN formation_sessions s ON s.id = se.session_id WHERE se.id = $1`,
    [seanceId]
  );
  return r?.conservation_replays_jours ? new Date(Date.now() + r.conservation_replays_jours * 86400000) : null;
}

async function prevenirParticipants(seanceId) {
  const { rows } = await pool.query(
    `SELECT i.id, i.user_id, se.titre FROM formation_seances se
       JOIN formation_inscriptions i ON i.session_id = se.session_id AND i.statut = 'validee'
      WHERE se.id = $1`,
    [seanceId]
  );
  for (const r of rows) {
    await creerNotification(r.user_id, "formation_replay", `Le replay de « ${r.titre} » est disponible.`, `/mes-formations/${r.id}`);
  }
}

/**
 * Synchronise les enregistrements d'une séance BigBlueButton.
 * Sans danger si appelée plusieurs fois (un enregistrement déjà importé est ignoré).
 * @returns {Promise<{ importes: number, en_attente: number, erreurs: string[] }>}
 */
export async function synchroniserReplays(seance) {
  const bilan = { importes: 0, en_attente: 0, erreurs: [] };
  if (!seance?.bbb_meeting_id) return bilan;

  const enregistrements = await listerEnregistrements(seance.bbb_meeting_id);
  for (const rec of enregistrements) {
    const { rows: [exist] } = await pool.query("SELECT * FROM formation_replays WHERE bbb_record_id = $1", [rec.recordId]);
    if (exist?.statut === "disponible") continue;

    const video = rec.formats.find((f) => f.type === "video");
    const dureeSec = rec.debut && rec.fin ? Math.round((rec.fin - rec.debut) / 1000) : null;
    const { rows: [replay] } = exist
      ? { rows: [exist] }
      : await pool.query(
          `INSERT INTO formation_replays (seance_id, titre, statut, bbb_record_id, duree_secondes, expire_le)
           VALUES ($1, $2, 'traitement', $3, $4, $5) RETURNING *`,
          [seance.id, seance.titre, rec.recordId, dureeSec, await dateExpiration(seance.id)]
        );

    if (!video) {
      bilan.en_attente += 1;
      if (rec.etat === "published" || rec.etat === "unpublished") {
        await pool.query(
          "UPDATE formation_replays SET statut = 'erreur', erreur = $1 WHERE id = $2",
          ["Le format « video » n'est pas activé sur le serveur BigBlueButton (bbb-playback-video) : la vidéo MP4 n'a pas été produite.", replay.id]
        );
        bilan.erreurs.push(`${rec.recordId} : format vidéo absent`);
      }
      continue;
    }
    const url = urlFichierVideo(video, rec.recordId);
    if (enCours.has(rec.recordId)) continue;
    enCours.add(rec.recordId);
    try {
      const fichier = await importerDepuisUrl({
        url,
        nomOriginal: `${seance.titre}.mp4`.replace(/[\\/:*?"<>|]/g, "-"),
        typeMime: "video/mp4",
        dossier: `replays/seance-${seance.id}`,
      });
      await pool.query(
        `UPDATE formation_replays SET statut = 'disponible', fichier_id = $1, erreur = NULL,
                duree_secondes = COALESCE($2, duree_secondes) WHERE id = $3`,
        [fichier.id, video.dureeMinutes ? video.dureeMinutes * 60 : dureeSec, replay.id]
      );
      bilan.importes += 1;
      await prevenirParticipants(seance.id);
    } catch (err) {
      await pool.query("UPDATE formation_replays SET statut = 'erreur', erreur = $1 WHERE id = $2", [String(err.message).slice(0, 500), replay.id]);
      bilan.erreurs.push(`${rec.recordId} : ${err.message}`);
    } finally {
      enCours.delete(rec.recordId);
    }
  }
  return bilan;
}

/** Lance une synchronisation en tâche de fond (après le rappel de BigBlueButton). */
export function synchroniserEnArrierePlan(seance) {
  setImmediate(() =>
    synchroniserReplays(seance).catch((err) => console.error(`Import replays séance ${seance.id} :`, err.message))
  );
}

export { prevenirParticipants, dateExpiration };
