// 📁 backend/controllers/formations.controller.js
// Plateforme de formation — côté public et côté participant (candidats et partenaires).
// Les erreurs levées (erreur(status, message)) sont rendues par le gestionnaire global
// d'Express 5, qui transmet aussi les rejets des fonctions async.
import { pool } from "../config/db.js";
import { FORMATION, erreur } from "../services/formation/config.js";
import { bbbConfigure, creerSalle, identifiantSalle, lienEntree } from "../services/formation/bbb.service.js";
import { enregistrerFichier, lienTemporaire, lireFichier } from "../services/formation/stockage.service.js";
import { calculerResultatsSession } from "../services/formation/resultats.service.js";
import { envoyerEmail, idParam, inscriptionValidee, journaliser } from "../services/formation/outils.js";
import { creerNotification, notifierAdmins } from "./notifications.controller.js";

/* ------------------------------------------------------------------ */
/*  Public                                                            */
/* ------------------------------------------------------------------ */

const SQL_PLACES = `
  (SELECT COUNT(*)::int FROM formation_inscriptions i
    WHERE i.session_id = s.id AND i.statut IN ('validee', 'en_attente'))`;

// GET /formations : catalogue (formations publiées et leurs prochaines sessions)
export async function listerCatalogue(_req, res) {
  const { rows } = await pool.query(
    `SELECT f.id, f.slug, f.titre, f.resume, f.image_url, f.formateur_nom, f.duree_heures,
            (SELECT json_agg(x ORDER BY x.date_debut NULLS LAST) FROM (
               SELECT s.id, s.intitule, s.date_debut, s.date_fin, s.tarif_fcfa, s.statut, s.places_max,
                      CASE WHEN s.places_max IS NULL THEN NULL ELSE GREATEST(s.places_max - ${SQL_PLACES}, 0) END AS places_restantes
                 FROM formation_sessions s
                WHERE s.formation_id = f.id AND s.statut IN ('ouverte', 'fermee')
                  AND (s.date_fin IS NULL OR s.date_fin >= CURRENT_DATE)
             ) x) AS sessions
       FROM formations f
      WHERE f.statut = 'publiee'
      ORDER BY f.maj_le DESC`
  );
  res.json({ formations: rows.map((f) => ({ ...f, sessions: f.sessions || [] })) });
}

// GET /formations/fiche/:slug : fiche détaillée (+ inscriptions du visiteur s'il est connecté)
export async function ficheFormation(req, res) {
  const { rows: [formation] } = await pool.query(
    `SELECT id, slug, titre, resume, description, objectifs, public_cible, prerequis, image_url,
            formateur_nom, duree_heures, statut
       FROM formations WHERE slug = $1`,
    [req.params.slug]
  );
  const estAdmin = ["admin", "superadmin"].includes(req.user?.role);
  if (!formation || (formation.statut !== "publiee" && !estAdmin)) throw erreur(404, "Formation introuvable.");

  const { rows: sessions } = await pool.query(
    `SELECT s.id, s.intitule, s.date_debut, s.date_fin, s.tarif_fcfa, s.statut, s.places_max,
            s.mode_inscription, s.seuil_presence, s.seuil_note, s.replay_telechargeable,
            CASE WHEN s.places_max IS NULL THEN NULL ELSE GREATEST(s.places_max - ${SQL_PLACES}, 0) END AS places_restantes,
            (SELECT json_agg(json_build_object('titre', se.titre, 'debut', se.debut, 'duree_minutes', se.duree_minutes) ORDER BY se.debut)
               FROM formation_seances se WHERE se.session_id = s.id AND se.statut <> 'annulee') AS seances
       FROM formation_sessions s
      WHERE s.formation_id = $1 AND s.statut <> 'annulee'
      ORDER BY s.date_debut NULLS LAST, s.id`,
    [formation.id]
  );

  let mesInscriptions = {};
  if (req.user?.id) {
    const { rows } = await pool.query(
      `SELECT i.id, i.session_id, i.statut, i.paiement_statut FROM formation_inscriptions i
         JOIN formation_sessions s ON s.id = i.session_id
        WHERE i.user_id = $1 AND s.formation_id = $2`,
      [req.user.id, formation.id]
    );
    mesInscriptions = Object.fromEntries(rows.map((r) => [r.session_id, r]));
  }

  res.json({
    formation,
    sessions: sessions.map((s) => ({ ...s, seances: s.seances || [], mon_inscription: mesInscriptions[s.id] || null })),
  });
}

// GET /formations/certificats/verifier/:numero : vérification publique (QR code)
export async function verifierCertificat(req, res) {
  const numero = String(req.params.numero || "").trim().toUpperCase().slice(0, 60);
  const { rows: [c] } = await pool.query(
    `SELECT c.numero, c.delivre_le, c.revoque, c.revoque_le,
            u.nom, u.prenom, f.titre AS formation, f.duree_heures,
            s.intitule AS session, s.date_debut, s.date_fin, i.note_finale
       FROM formation_certificats c
       JOIN formation_inscriptions i ON i.id = c.inscription_id
       JOIN users u ON u.id = i.user_id
       JOIN formation_sessions s ON s.id = i.session_id
       JOIN formations f ON f.id = s.formation_id
      WHERE upper(c.numero) = $1`,
    [numero]
  );
  if (!c) return res.json({ valide: false, message: "Aucun certificat ne correspond à ce numéro." });
  res.json({
    valide: !c.revoque,
    message: c.revoque ? "Ce certificat a été révoqué." : "Certificat authentique délivré par CDO Consulting Tchad.",
    certificat: {
      numero: c.numero,
      titulaire: [c.prenom, c.nom].filter(Boolean).join(" "),
      formation: c.formation,
      session: c.session,
      date_debut: c.date_debut,
      date_fin: c.date_fin,
      duree_heures: c.duree_heures,
      note_finale: c.note_finale,
      delivre_le: c.delivre_le,
      revoque_le: c.revoque_le,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Participant                                                       */
/* ------------------------------------------------------------------ */

// POST /formations/sessions/:id/inscription  { consentement: true }
export async function inscrire(req, res) {
  const sessionId = idParam(req);
  if (req.body?.consentement !== true) {
    throw erreur(400, "Merci d'accepter l'enregistrement des séances (replays réservés aux participants).");
  }

  const client = await pool.connect();
  let inscription, session;
  try {
    await client.query("BEGIN");
    // Verrou sur la session : deux inscriptions simultanées ne dépassent pas le nombre de places
    const { rows: [s] } = await client.query(
      `SELECT s.*, f.titre AS formation_titre, f.slug, f.statut AS formation_statut
         FROM formation_sessions s JOIN formations f ON f.id = s.formation_id
        WHERE s.id = $1 FOR UPDATE OF s`,
      [sessionId]
    );
    session = s;
    if (!s || s.formation_statut !== "publiee") throw erreur(404, "Session introuvable.");
    if (s.statut !== "ouverte") throw erreur(409, "Les inscriptions à cette session sont fermées.");

    const { rows: [exist] } = await client.query(
      "SELECT * FROM formation_inscriptions WHERE session_id = $1 AND user_id = $2",
      [sessionId, req.user.id]
    );
    if (exist && ["validee", "en_attente"].includes(exist.statut)) {
      throw erreur(409, "Vous êtes déjà inscrit(e) à cette session.");
    }

    if (s.places_max) {
      const { rows: [{ n }] } = await client.query(
        "SELECT COUNT(*)::int AS n FROM formation_inscriptions WHERE session_id = $1 AND statut IN ('validee', 'en_attente')",
        [sessionId]
      );
      if (n >= s.places_max) throw erreur(409, "Cette session est complète.");
    }

    const payante = s.tarif_fcfa > 0;
    const statut = !payante && s.mode_inscription === "automatique" ? "validee" : "en_attente";
    const paiement = payante ? "en_attente" : "gratuit";

    const { rows } = exist
      ? await client.query(
          `UPDATE formation_inscriptions
              SET statut = $1, paiement_statut = $2, consentement_enregistrement = true, consentement_le = now(),
                  cree_le = now(), valide_le = CASE WHEN $1 = 'validee' THEN now() ELSE NULL END
            WHERE id = $3 RETURNING *`,
          [statut, paiement, exist.id]
        )
      : await client.query(
          `INSERT INTO formation_inscriptions
             (session_id, user_id, statut, paiement_statut, consentement_enregistrement, consentement_le, valide_le)
           VALUES ($1, $2, $3, $4, true, now(), CASE WHEN $3 = 'validee' THEN now() ELSE NULL END) RETURNING *`,
          [sessionId, req.user.id, statut, paiement]
        );
    inscription = rows[0];
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }

  const lien = `/mes-formations/${inscription.id}`;
  const valide = inscription.statut === "validee";
  const message = valide
    ? `Inscription confirmée : ${session.formation_titre} (${session.intitule}).`
    : session.tarif_fcfa > 0
    ? `Inscription enregistrée : ${session.formation_titre}. Elle sera validée à réception du paiement (${session.tarif_fcfa.toLocaleString("fr-FR")} FCFA).`
    : `Inscription enregistrée : ${session.formation_titre}. Elle sera validée par l'administration.`;

  await creerNotification(req.user.id, "formation_inscription", message, lien);
  await notifierAdmins(
    "formation_inscription",
    `Nouvelle inscription (${valide ? "validée" : "à valider"}) : ${session.formation_titre} — ${session.intitule}.`,
    `/admin/formations/sessions/${session.id}`
  );
  envoyerEmail({
    to: req.user.email,
    sujet: valide ? "Inscription confirmée — CDO Tchad" : "Inscription enregistrée — CDO Tchad",
    titre: session.formation_titre,
    paragraphes: [message, "Retrouvez le programme, les liens d'accès aux séances et les supports dans votre espace."],
    lien: `${FORMATION.siteUrl}${lien}`,
    libelleLien: "Mon espace formation",
  });

  res.status(201).json({ inscription, message });
}

// DELETE /formations/sessions/:id/inscription
export async function annulerInscription(req, res) {
  const sessionId = idParam(req);
  const { rows } = await pool.query(
    `UPDATE formation_inscriptions SET statut = 'annulee'
      WHERE session_id = $1 AND user_id = $2 AND statut IN ('validee', 'en_attente')
      RETURNING id`,
    [sessionId, req.user.id]
  );
  if (!rows[0]) throw erreur(404, "Aucune inscription active à cette session.");
  res.json({ ok: true });
}

// GET /formations/espace : formations du participant connecté
export async function mesFormations(req, res) {
  const { rows } = await pool.query(
    `SELECT i.id, i.statut, i.paiement_statut, i.cree_le, i.admis, i.note_finale, i.presence_pct,
            s.id AS session_id, s.intitule, s.date_debut, s.date_fin, s.tarif_fcfa, s.resultats_publies_le,
            f.titre, f.slug, f.image_url,
            (SELECT min(se.debut) FROM formation_seances se
              WHERE se.session_id = s.id AND se.statut IN ('planifiee', 'en_cours')
                AND se.debut + make_interval(mins => se.duree_minutes) > now()) AS prochaine_seance,
            (SELECT c.id FROM formation_certificats c WHERE c.inscription_id = i.id AND NOT c.revoque) AS certificat_id
       FROM formation_inscriptions i
       JOIN formation_sessions s ON s.id = i.session_id
       JOIN formations f ON f.id = s.formation_id
      WHERE i.user_id = $1 AND i.statut <> 'annulee'
      ORDER BY COALESCE(s.date_debut, i.cree_le::date) DESC`,
    [req.user.id]
  );
  res.json({
    inscriptions: rows.map((r) => ({
      ...r,
      // Les résultats ne sont visibles qu'après publication par l'administration
      admis: r.resultats_publies_le ? r.admis : null,
      note_finale: r.resultats_publies_le ? r.note_finale : null,
    })),
  });
}

function etatSeance(se) {
  const maintenant = Date.now();
  const debut = new Date(se.debut).getTime();
  const fin = debut + se.duree_minutes * 60000;
  const ouverture = debut - FORMATION.bbb.ouvertureAvantMinutes * 60000;
  if (se.statut === "annulee") return "annulee";
  if (se.statut === "terminee" || maintenant > fin + 30 * 60000) return "terminee";
  if (se.statut === "en_cours" || (maintenant >= ouverture && maintenant <= fin + 30 * 60000)) return "ouverte";
  return "a_venir";
}

async function lireInscription(req) {
  const id = idParam(req);
  const { rows: [ins] } = await pool.query(
    `SELECT i.*, s.intitule, s.date_debut, s.date_fin, s.tarif_fcfa, s.statut AS session_statut,
            s.seuil_presence, s.seuil_note, s.regle_absence, s.replay_telechargeable, s.resultats_publies_le,
            f.id AS formation_id, f.titre, f.slug, f.formateur_nom, f.duree_heures
       FROM formation_inscriptions i
       JOIN formation_sessions s ON s.id = i.session_id
       JOIN formations f ON f.id = s.formation_id
      WHERE i.id = $1 AND i.user_id = $2`,
    [id, req.user.id]
  );
  if (!ins) throw erreur(404, "Inscription introuvable.");
  return ins;
}

// GET /formations/espace/inscriptions/:id : tout le contenu d'une session pour le participant
export async function detailInscription(req, res) {
  const ins = await lireInscription(req);
  const base = {
    inscription: {
      id: ins.id, statut: ins.statut, paiement_statut: ins.paiement_statut, cree_le: ins.cree_le,
      session_id: ins.session_id,
    },
    formation: { id: ins.formation_id, titre: ins.titre, slug: ins.slug, formateur_nom: ins.formateur_nom, duree_heures: ins.duree_heures },
    session: {
      intitule: ins.intitule, date_debut: ins.date_debut, date_fin: ins.date_fin, tarif_fcfa: ins.tarif_fcfa,
      seuil_presence: ins.seuil_presence, seuil_note: ins.seuil_note, regle_absence: ins.regle_absence,
      replay_telechargeable: ins.replay_telechargeable, resultats_publies_le: ins.resultats_publies_le,
    },
  };
  if (ins.statut !== "validee") return res.json({ ...base, seances: [], supports: [], replays: [], evaluations: [] });

  const [{ rows: seances }, { rows: supports }, { rows: replays }, { rows: evaluations }, { rows: [certificat] }] = await Promise.all([
    pool.query(
      `SELECT se.id, se.titre, se.debut, se.duree_minutes, se.fournisseur, se.statut,
              p.premiere_arrivee, p.duree_secondes
         FROM formation_seances se
         LEFT JOIN formation_presences p ON p.seance_id = se.id AND p.inscription_id = $2
        WHERE se.session_id = $1 ORDER BY se.debut`,
      [ins.session_id, ins.id]
    ),
    pool.query(
      `SELECT sp.id, sp.titre, sp.seance_id, sp.cree_le, f.nom_original, f.taille_octets, f.type_mime
         FROM formation_supports sp JOIN formation_fichiers f ON f.id = sp.fichier_id
        WHERE sp.session_id = $1 ORDER BY sp.cree_le`,
      [ins.session_id]
    ),
    pool.query(
      `SELECT r.id, r.titre, r.seance_id, r.duree_secondes, r.cree_le, r.expire_le, se.titre AS seance_titre,
              v.secondes_vues, v.termine
         FROM formation_replays r
         JOIN formation_seances se ON se.id = r.seance_id
         LEFT JOIN formation_replay_vues v ON v.replay_id = r.id AND v.inscription_id = $2
        WHERE se.session_id = $1 AND r.publie AND r.statut = 'disponible'
          AND (r.expire_le IS NULL OR r.expire_le > now())
        ORDER BY se.debut, r.id`,
      [ins.session_id, ins.id]
    ),
    pool.query(
      `SELECT e.id, e.titre, e.type, e.consignes, e.note_reussite, e.essais_max, e.date_limite,
              (SELECT COUNT(*)::int FROM formation_questions q WHERE q.evaluation_id = e.id) AS nb_questions,
              (SELECT COUNT(*)::int FROM formation_tentatives t WHERE t.evaluation_id = e.id AND t.inscription_id = $2) AS essais_utilises,
              (SELECT MAX(t.note_pct) FROM formation_tentatives t WHERE t.evaluation_id = e.id AND t.inscription_id = $2 AND t.statut = 'corrigee') AS meilleure_note,
              (SELECT bool_or(t.statut = 'soumise') FROM formation_tentatives t WHERE t.evaluation_id = e.id AND t.inscription_id = $2) AS en_correction
         FROM formation_evaluations e
        WHERE e.session_id = $1 AND e.publiee ORDER BY e.ordre, e.id`,
      [ins.session_id, ins.id]
    ),
    pool.query(
      "SELECT id, numero, delivre_le FROM formation_certificats WHERE inscription_id = $1 AND NOT revoque",
      [ins.id]
    ),
  ]);

  let resultats = null;
  if (ins.resultats_publies_le) {
    resultats = { presence_pct: ins.presence_pct, note_finale: ins.note_finale, admis: ins.admis };
  } else {
    // Avant publication : présence provisoire seulement (la note reste confidentielle)
    const calc = await calculerResultatsSession(ins.session_id);
    const moi = calc?.lignes.find((l) => l.inscription_id === ins.id);
    resultats = { provisoire: true, presence_pct: moi?.presence_pct ?? null };
  }

  res.json({
    ...base,
    seances: seances.map((s) => ({ ...s, etat: etatSeance(s) })),
    supports,
    replays,
    evaluations,
    resultats,
    certificat: certificat || null,
  });
}

// POST /formations/espace/seances/:id/rejoindre : lien d'entrée personnel
export async function rejoindreSeance(req, res) {
  const seanceId = idParam(req);
  const { rows: [se] } = await pool.query(
    `SELECT se.*, f.titre AS formation_titre FROM formation_seances se
       JOIN formation_sessions s ON s.id = se.session_id
       JOIN formations f ON f.id = s.formation_id
      WHERE se.id = $1`,
    [seanceId]
  );
  if (!se) throw erreur(404, "Séance introuvable.");
  const ins = await inscriptionValidee(req.user.id, se.session_id);

  const etat = etatSeance(se);
  if (etat === "a_venir") {
    throw erreur(409, `La salle ouvre ${FORMATION.bbb.ouvertureAvantMinutes} minutes avant le début de la séance.`);
  }
  if (etat !== "ouverte") throw erreur(409, "Cette séance est terminée : retrouvez son replay dans votre espace.");

  let url;
  if (se.fournisseur === "externe") {
    if (!se.lien_externe) throw erreur(409, "Le lien de la séance n'est pas encore disponible.");
    url = se.lien_externe;
  } else {
    if (!bbbConfigure()) throw erreur(503, "La classe virtuelle n'est pas encore configurée. Contactez l'administration.");
    if (!se.bbb_meeting_id) {
      se.bbb_meeting_id = identifiantSalle(se);
      await pool.query("UPDATE formation_seances SET bbb_meeting_id = $1 WHERE id = $2 AND bbb_meeting_id IS NULL", [se.bbb_meeting_id, se.id]);
      const { rows: [r] } = await pool.query("SELECT bbb_meeting_id FROM formation_seances WHERE id = $1", [se.id]);
      se.bbb_meeting_id = r.bbb_meeting_id;
    }
    // create est idempotent : si le formateur a déjà ouvert la salle, BBB renvoie la même
    await creerSalle({ seance: se, formationTitre: se.formation_titre });
    const { rows: [u] } = await pool.query("SELECT nom, prenom FROM users WHERE id = $1", [req.user.id]);
    const nom = [u?.prenom, u?.nom].filter(Boolean).join(" ") || req.user.email;
    url = lienEntree({ meetingID: se.bbb_meeting_id, nom, userId: req.user.id, moderateur: false });
  }

  // Heure d'arrivée (la durée est complétée par BigBlueButton en fin de séance)
  await pool.query(
    `INSERT INTO formation_presences (seance_id, inscription_id, premiere_arrivee, source)
     VALUES ($1, $2, now(), 'lien')
     ON CONFLICT (seance_id, inscription_id) DO UPDATE
       SET premiere_arrivee = COALESCE(formation_presences.premiere_arrivee, now()), maj_le = now()`,
    [se.id, ins.id]
  );
  await journaliser(req, "entree_salle", "seance", se.id);
  res.json({ url });
}

async function sessionDe(table, id) {
  const sql = {
    support: "SELECT sp.session_id, sp.fichier_id FROM formation_supports sp WHERE sp.id = $1",
    replay: `SELECT se.session_id, r.fichier_id, r.publie, r.statut, r.expire_le, r.duree_secondes, s.replay_telechargeable
               FROM formation_replays r JOIN formation_seances se ON se.id = r.seance_id
               JOIN formation_sessions s ON s.id = se.session_id WHERE r.id = $1`,
  }[table];
  const { rows } = await pool.query(sql, [id]);
  if (!rows[0]) throw erreur(404, "Contenu introuvable.");
  return rows[0];
}

// GET /formations/espace/supports/:id/lien
export async function lienSupport(req, res) {
  const id = idParam(req);
  const sp = await sessionDe("support", id);
  await inscriptionValidee(req.user.id, sp.session_id);
  const fichier = await lireFichier(sp.fichier_id);
  if (!fichier) throw erreur(404, "Fichier introuvable.");
  const lien = await lienTemporaire(fichier, { telecharger: req.query.telecharger === "1", userId: req.user.id });
  await journaliser(req, req.query.telecharger === "1" ? "telechargement_support" : "lecture_support", "support", id);
  res.json(lien);
}

// GET /formations/espace/replays/:id/lien[?telecharger=1]
export async function lienReplay(req, res) {
  const id = idParam(req);
  const r = await sessionDe("replay", id);
  await inscriptionValidee(req.user.id, r.session_id);
  if (!r.publie || r.statut !== "disponible" || !r.fichier_id || (r.expire_le && new Date(r.expire_le) < new Date())) {
    throw erreur(404, "Replay indisponible.");
  }
  const telecharger = req.query.telecharger === "1";
  if (telecharger && !r.replay_telechargeable) throw erreur(409, "Le téléchargement n'est pas autorisé pour cette formation : lecture en ligne uniquement.");
  const fichier = await lireFichier(r.fichier_id);
  if (!fichier) throw erreur(404, "Fichier introuvable.");
  const lien = await lienTemporaire(fichier, { telecharger, userId: req.user.id });
  await journaliser(req, telecharger ? "telechargement_replay" : "lecture_replay", "replay", id);
  res.json(lien);
}

// POST /formations/espace/replays/:id/progression  { secondes, termine }
export async function progressionReplay(req, res) {
  const id = idParam(req);
  const r = await sessionDe("replay", id);
  const ins = await inscriptionValidee(req.user.id, r.session_id);
  const secondes = Math.max(0, Math.floor(Number(req.body?.secondes) || 0));
  // Vu en entier : 95 % de la durée connue, sinon fin de lecture signalée par le lecteur
  const termine = r.duree_secondes ? secondes >= r.duree_secondes * 0.95 : req.body?.termine === true;
  const { rows: [v] } = await pool.query(
    `INSERT INTO formation_replay_vues (replay_id, inscription_id, secondes_vues, termine)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (replay_id, inscription_id) DO UPDATE
       SET secondes_vues = GREATEST(formation_replay_vues.secondes_vues, EXCLUDED.secondes_vues),
           termine = formation_replay_vues.termine OR EXCLUDED.termine, maj_le = now()
     RETURNING secondes_vues, termine`,
    [id, ins.id, secondes, termine]
  );
  res.json(v);
}

/* ---------------------------- Évaluations ---------------------------- */

async function evaluationParticipant(req) {
  const id = idParam(req);
  const { rows: [e] } = await pool.query("SELECT * FROM formation_evaluations WHERE id = $1 AND publiee", [id]);
  if (!e) throw erreur(404, "Évaluation introuvable.");
  const ins = await inscriptionValidee(req.user.id, e.session_id);
  return { e, ins };
}

// GET /formations/espace/evaluations/:id : questions (sans les réponses) et mes tentatives
export async function lireEvaluation(req, res) {
  const { e, ins } = await evaluationParticipant(req);
  const [{ rows: questions }, { rows: tentatives }] = await Promise.all([
    pool.query(
      "SELECT id, type, enonce, options, points, explication, bonnes_reponses FROM formation_questions WHERE evaluation_id = $1 ORDER BY ordre, id",
      [e.id]
    ),
    pool.query(
      `SELECT id, numero, reponses, score, score_max, note_pct, statut, commentaire, soumise_le, corrigee_le, fichier_id
         FROM formation_tentatives WHERE evaluation_id = $1 AND inscription_id = $2 ORDER BY numero`,
      [e.id, ins.id]
    ),
  ]);
  const essaisRestants = Math.max(0, e.essais_max - tentatives.length);
  // La correction détaillée (bonnes réponses, explications) n'est montrée qu'une fois
  // tous les essais utilisés, pour ne pas donner les réponses avant le dernier essai.
  const montrerCorrection = essaisRestants === 0 || (e.date_limite && new Date(e.date_limite) < new Date());
  res.json({
    evaluation: {
      id: e.id, titre: e.titre, type: e.type, consignes: e.consignes, note_reussite: e.note_reussite,
      essais_max: e.essais_max, date_limite: e.date_limite,
    },
    questions: questions.map(({ bonnes_reponses, explication, ...q }) =>
      montrerCorrection ? { ...q, bonnes_reponses, explication } : q
    ),
    tentatives: tentatives.map(({ fichier_id, ...t }) => ({ ...t, a_un_fichier: Boolean(fichier_id) })),
    essais_restants: essaisRestants,
    correction_visible: Boolean(montrerCorrection),
  });
}

const normaliser = (s) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export function corrigerQuiz(questions, reponses) {
  let score = 0;
  let max = 0;
  const detail = {};
  for (const q of questions) {
    const pts = Number(q.points) || 1;
    max += pts;
    const r = reponses?.[q.id];
    let juste = false;
    if (q.type === "reponse_courte") {
      const acceptees = (q.bonnes_reponses || []).map(normaliser);
      juste = r != null && acceptees.includes(normaliser(r));
    } else {
      const attendu = [...(q.bonnes_reponses || [])].map(Number).sort();
      const donne = [...(Array.isArray(r) ? r : r == null ? [] : [r])].map(Number).sort();
      juste = attendu.length > 0 && attendu.length === donne.length && attendu.every((v, i) => v === donne[i]);
    }
    if (juste) score += pts;
    detail[q.id] = { reponse: r ?? null, juste };
  }
  return { score, max, note: max > 0 ? Math.round((score / max) * 10000) / 100 : 0, detail };
}

function controlerFenetre(e, nbTentatives) {
  if (e.date_limite && new Date(e.date_limite) < new Date()) throw erreur(409, "La date limite est dépassée.");
  if (nbTentatives >= e.essais_max) throw erreur(409, "Vous avez utilisé tous vos essais.");
}

// POST /formations/espace/evaluations/:id/tentatives  { reponses: { [questionId]: index | [index] | "texte" } }
export async function soumettreQuiz(req, res) {
  const { e, ins } = await evaluationParticipant(req);
  if (e.type !== "quiz") throw erreur(400, "Cette évaluation est un devoir à déposer.");
  const { rows: [{ n }] } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM formation_tentatives WHERE evaluation_id = $1 AND inscription_id = $2",
    [e.id, ins.id]
  );
  controlerFenetre(e, n);
  const { rows: questions } = await pool.query("SELECT * FROM formation_questions WHERE evaluation_id = $1", [e.id]);
  if (questions.length === 0) throw erreur(409, "Ce quiz ne contient encore aucune question.");

  const corr = corrigerQuiz(questions, req.body?.reponses || {});
  const { rows: [t] } = await pool.query(
    `INSERT INTO formation_tentatives (evaluation_id, inscription_id, numero, reponses, score, score_max, note_pct, statut, corrigee_le)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'corrigee', now())
     RETURNING id, numero, score, score_max, note_pct, statut, soumise_le`,
    [e.id, ins.id, n + 1, JSON.stringify(corr.detail), corr.score, corr.max, corr.note]
  );
  const seuil = e.note_reussite ?? null;
  res.status(201).json({ tentative: t, reussi: seuil == null ? null : corr.note >= seuil, essais_restants: e.essais_max - n - 1 });
}

// POST /formations/espace/evaluations/:id/devoir (multipart, champ « fichier »)
export async function deposerDevoir(req, res) {
  const { e, ins } = await evaluationParticipant(req);
  if (!req.file) throw erreur(400, "Aucun fichier reçu.");
  if (e.type !== "devoir") throw erreur(400, "Cette évaluation est un quiz.");
  const { rows: [{ n }] } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM formation_tentatives WHERE evaluation_id = $1 AND inscription_id = $2",
    [e.id, ins.id]
  );
  controlerFenetre(e, n);
  const fichier = await enregistrerFichier({
    cheminTemp: req.file.path, nomOriginal: req.file.originalname, typeMime: req.file.mimetype, dossier: `devoirs/session-${e.session_id}`,
  });
  const { rows: [t] } = await pool.query(
    `INSERT INTO formation_tentatives (evaluation_id, inscription_id, numero, fichier_id, statut, commentaire)
     VALUES ($1, $2, $3, $4, 'soumise', $5) RETURNING id, numero, statut, soumise_le`,
    [e.id, ins.id, n + 1, fichier.id, typeof req.body?.commentaire === "string" ? req.body.commentaire.slice(0, 2000) : null]
  );
  await notifierAdmins("formation_devoir", `Devoir déposé : « ${e.titre} » (à corriger).`, `/admin/formations/evaluations/${e.id}`);
  res.status(201).json({ tentative: t });
}

// GET /formations/espace/certificats/:id/lien
export async function lienCertificat(req, res) {
  const id = idParam(req);
  const { rows: [c] } = await pool.query(
    `SELECT c.* FROM formation_certificats c JOIN formation_inscriptions i ON i.id = c.inscription_id
      WHERE c.id = $1 AND i.user_id = $2 AND NOT c.revoque`,
    [id, req.user.id]
  );
  if (!c?.fichier_id) throw erreur(404, "Certificat introuvable.");
  const fichier = await lireFichier(c.fichier_id);
  const lien = await lienTemporaire(fichier, { telecharger: true, userId: req.user.id });
  await journaliser(req, "telechargement_certificat", "certificat", id);
  res.json(lien);
}
