// 📁 backend/services/formation/resultats.service.js
// Calcul de la présence, de la note finale et de l'admission (règles de l'analyse, §05) :
//   - présence : temps passé dans chaque séance terminée, plafonné à sa durée, rapporté
//     à la durée totale des directs ; si la règle est « presence_ou_replay », une séance
//     dont le replay a été vu en entier compte comme suivie ;
//   - note finale : moyenne des meilleures notes obtenues à chaque évaluation publiée ;
//   - admis : présence >= seuil ET note finale >= seuil ET, pour chaque évaluation qui a
//     sa propre note de réussite, meilleure note >= cette note.
import { pool } from "../../config/db.js";

const arrondi = (x) => (x == null ? null : Math.round(x * 100) / 100);

export async function calculerResultatsSession(sessionId, { enregistrer = false } = {}) {
  const { rows: [session] } = await pool.query("SELECT * FROM formation_sessions WHERE id = $1", [sessionId]);
  if (!session) return null;

  const { rows: seances } = await pool.query(
    `SELECT id, duree_minutes FROM formation_seances
      WHERE session_id = $1 AND statut <> 'annulee'
        AND (statut = 'terminee' OR debut + make_interval(mins => duree_minutes) < now())`,
    [sessionId]
  );
  const totalSecondes = seances.reduce((s, x) => s + x.duree_minutes * 60, 0);

  const { rows: inscriptions } = await pool.query(
    `SELECT i.id, i.user_id, i.admis, u.nom, u.prenom, u.email
       FROM formation_inscriptions i JOIN users u ON u.id = i.user_id
      WHERE i.session_id = $1 AND i.statut = 'validee'
      ORDER BY u.nom NULLS LAST, u.prenom NULLS LAST, u.email`,
    [sessionId]
  );

  const { rows: presences } = await pool.query(
    `SELECT p.inscription_id, p.seance_id, p.duree_secondes
       FROM formation_presences p JOIN formation_seances s ON s.id = p.seance_id
      WHERE s.session_id = $1`,
    [sessionId]
  );
  const { rows: vues } = await pool.query(
    `SELECT DISTINCT v.inscription_id, r.seance_id
       FROM formation_replay_vues v
       JOIN formation_replays r ON r.id = v.replay_id
       JOIN formation_seances s ON s.id = r.seance_id
      WHERE s.session_id = $1 AND v.termine`,
    [sessionId]
  );
  const { rows: evaluations } = await pool.query(
    "SELECT id, titre, note_reussite FROM formation_evaluations WHERE session_id = $1 AND publiee ORDER BY ordre, id",
    [sessionId]
  );
  const { rows: meilleures } = await pool.query(
    `SELECT t.inscription_id, t.evaluation_id, MAX(t.note_pct)::float AS note
       FROM formation_tentatives t JOIN formation_evaluations e ON e.id = t.evaluation_id
      WHERE e.session_id = $1 AND e.publiee AND t.statut = 'corrigee'
      GROUP BY t.inscription_id, t.evaluation_id`,
    [sessionId]
  );

  const presenceDe = new Map();
  for (const p of presences) presenceDe.set(`${p.inscription_id}:${p.seance_id}`, p.duree_secondes);
  const vuDe = new Set(vues.map((v) => `${v.inscription_id}:${v.seance_id}`));
  const noteDe = new Map(meilleures.map((m) => [`${m.inscription_id}:${m.evaluation_id}`, m.note]));

  const lignes = inscriptions.map((ins) => {
    let suivi = 0;
    const detailSeances = seances.map((s) => {
      const max = s.duree_minutes * 60;
      const direct = Math.min(presenceDe.get(`${ins.id}:${s.id}`) || 0, max);
      const replay = session.regle_absence === "presence_ou_replay" && vuDe.has(`${ins.id}:${s.id}`);
      const compte = replay ? max : direct;
      suivi += compte;
      return { seance_id: s.id, secondes_direct: direct, replay_vu: replay, secondes_retenues: compte };
    });
    const presencePct = totalSecondes > 0 ? (suivi / totalSecondes) * 100 : null;

    const notes = evaluations.map((e) => ({
      evaluation_id: e.id,
      titre: e.titre,
      note: noteDe.has(`${ins.id}:${e.id}`) ? noteDe.get(`${ins.id}:${e.id}`) : null,
      note_reussite: e.note_reussite,
    }));
    const noteFinale = evaluations.length
      ? notes.reduce((s, n) => s + (n.note ?? 0), 0) / evaluations.length
      : null;

    const presenceOk = presencePct == null ? false : presencePct >= session.seuil_presence;
    const noteOk = noteFinale == null ? true : noteFinale >= session.seuil_note;
    const evalsOk = notes.every((n) => n.note_reussite == null || (n.note ?? 0) >= n.note_reussite);

    return {
      inscription_id: ins.id,
      user_id: ins.user_id,
      nom: ins.nom,
      prenom: ins.prenom,
      email: ins.email,
      presence_pct: arrondi(presencePct),
      note_finale: arrondi(noteFinale),
      admis_calcule: presenceOk && noteOk && evalsOk,
      admis: ins.admis,
      seances: detailSeances,
      notes,
    };
  });

  if (enregistrer) {
    for (const l of lignes) {
      await pool.query(
        "UPDATE formation_inscriptions SET presence_pct = $1, note_finale = $2, admis = $3 WHERE id = $4",
        [l.presence_pct, l.note_finale, l.admis_calcule, l.inscription_id]
      );
      l.admis = l.admis_calcule;
    }
  }

  return {
    session: {
      id: session.id,
      seuil_presence: session.seuil_presence,
      seuil_note: session.seuil_note,
      regle_absence: session.regle_absence,
      resultats_publies_le: session.resultats_publies_le,
    },
    total_secondes_directs: totalSecondes,
    evaluations,
    lignes,
  };
}
