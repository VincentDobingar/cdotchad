// 📁 backend/controllers/formationsBbb.controller.js
// Rappels envoyés par le serveur BigBlueButton (fin de séance, enregistrement prêt,
// tableau d'apprentissage). Chaque URL de rappel porte un jeton signé par le site
// (paramètre t) : un appel qui ne le présente pas est ignoré.
import { pool } from "../config/db.js";
import { signatureValide } from "../services/formation/config.js";
import { lireParametresSignes } from "../services/formation/bbb.service.js";
import { synchroniserEnArrierePlan } from "../services/formation/replays.service.js";

async function seanceDe(meetingId) {
  if (!meetingId) return null;
  const { rows } = await pool.query("SELECT * FROM formation_seances WHERE bbb_meeting_id = $1", [meetingId]);
  return rows[0] || null;
}

const jetonOk = (meetingId, t) => {
  try {
    return Boolean(meetingId) && signatureValide(`bbb:${meetingId}`, t);
  } catch {
    return false;
  }
};

// GET|POST /formations/bbb/fin?t=…&meetingID=…
export async function rappelFin(req, res) {
  const meetingId = req.query.meetingID;
  if (!jetonOk(meetingId, req.query.t)) return res.status(401).end();
  const seance = await seanceDe(meetingId);
  if (seance) {
    await pool.query(
      "UPDATE formation_seances SET statut = 'terminee', terminee_le = COALESCE(terminee_le, now()) WHERE id = $1 AND statut <> 'annulee'",
      [seance.id]
    );
  }
  res.status(200).send("ok");
}

// POST /formations/bbb/enregistrement-pret?t=…  (corps : signed_parameters=<JWT>)
export async function rappelEnregistrement(req, res) {
  const params = lireParametresSignes(req.body?.signed_parameters);
  const meetingId = params?.meeting_id;
  if (!params || !jetonOk(meetingId, req.query.t)) return res.status(401).end();
  const seance = await seanceDe(meetingId);
  if (seance) synchroniserEnArrierePlan(seance);
  res.status(200).send("ok");
}

const enDate = (v) => {
  if (v == null) return null;
  const n = Number(v);
  const d = Number.isFinite(n) ? new Date(n > 1e12 ? n : n * 1000) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// POST /formations/bbb/analytique?t=…&meetingID=…
// Données du tableau d'apprentissage BBB : participants, entrées, sorties, durée.
export async function rappelAnalytique(req, res) {
  const meetingId = req.query.meetingID || req.body?.meeting_id || req.body?.data?.metadata?.meeting_id;
  if (!jetonOk(meetingId, req.query.t)) return res.status(401).end();
  const seance = await seanceDe(meetingId);
  if (!seance) return res.status(200).send("ok");

  const data = req.body?.data || req.body || {};
  const participants = Array.isArray(data.attendees) ? data.attendees : [];
  let n = 0;
  for (const a of participants) {
    const ext = String(a.ext_user_id || a.extId || a.external_user_id || "");
    const m = /^cdo-(\d+)$/.exec(ext);
    if (!m || a.moderator === true) continue;
    const userId = Number(m[1]);
    const joins = (a.joins || []).map((j) => enDate(j.timestamp ?? j)).filter(Boolean);
    const leaves = (a.leaves || []).map((l) => enDate(l.timestamp ?? l)).filter(Boolean);
    let duree = Number(a.duration);
    if (!Number.isFinite(duree) || duree <= 0) {
      // À défaut de durée fournie : somme des intervalles entrée → sortie
      duree = 0;
      joins.forEach((j, i) => {
        const fin = leaves[i] || enDate(data.finish) || new Date();
        duree += Math.max(0, (fin - j) / 1000);
      });
    }
    const arrivee = joins.length ? new Date(Math.min(...joins)) : null;
    const sortie = leaves.length ? new Date(Math.max(...leaves)) : null;

    const { rowCount } = await pool.query(
      `INSERT INTO formation_presences (seance_id, inscription_id, premiere_arrivee, derniere_sortie, duree_secondes, source)
       SELECT $1, i.id, $3, $4, $5, 'bbb' FROM formation_inscriptions i
        WHERE i.session_id = $2 AND i.user_id = $6
       ON CONFLICT (seance_id, inscription_id) DO UPDATE SET
         premiere_arrivee = LEAST(COALESCE(formation_presences.premiere_arrivee, EXCLUDED.premiere_arrivee), COALESCE(EXCLUDED.premiere_arrivee, formation_presences.premiere_arrivee)),
         derniere_sortie = GREATEST(formation_presences.derniere_sortie, EXCLUDED.derniere_sortie),
         duree_secondes = CASE WHEN formation_presences.source = 'manuel' THEN formation_presences.duree_secondes
                               ELSE GREATEST(formation_presences.duree_secondes, EXCLUDED.duree_secondes) END,
         source = CASE WHEN formation_presences.source = 'manuel' THEN 'manuel' ELSE 'bbb' END,
         maj_le = now()`,
      [seance.id, seance.session_id, arrivee, sortie, Math.round(duree), userId]
    );
    n += rowCount;
  }
  await pool.query(
    "UPDATE formation_seances SET statut = 'terminee', terminee_le = COALESCE(terminee_le, now()) WHERE id = $1 AND statut <> 'annulee'",
    [seance.id]
  );
  res.status(200).json({ presences: n });
}
