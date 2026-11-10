// 📁 backend/controllers/formationsAdmin.controller.js
// Plateforme de formation — administration (admin et superadmin).
// Monté sous /backend/admin/formations, toutes les routes exigent requireRole("admin", "superadmin").
import { pool } from "../config/db.js";
import { FORMATION, erreur } from "../services/formation/config.js";
import { bbbConfigure, creerSalle, identifiantSalle, lienEntree, terminerSalle } from "../services/formation/bbb.service.js";
import { enregistrerFichier, enregistrerTampon, lienTemporaire, lireFichier, supprimerFichier } from "../services/formation/stockage.service.js";
import { synchroniserReplays, prevenirParticipants, dateExpiration } from "../services/formation/replays.service.js";
import { calculerResultatsSession } from "../services/formation/resultats.service.js";
import { genererCertificatPDF, nouveauNumero, urlVerification } from "../services/formation/certificat.service.js";
import { booleen, entierPositif, envoyerEmail, idParam, journaliser, slugifier, texte } from "../services/formation/outils.js";
import { creerNotification } from "./notifications.controller.js";

/* ------------------------------------------------------------------ */
/*  Outils                                                            */
/* ------------------------------------------------------------------ */

function dans(valeur, permis, defaut) {
  if (valeur === undefined) return defaut;
  if (!permis.includes(valeur)) throw erreur(400, `Valeur non autorisée : ${valeur}. Attendu : ${permis.join(", ")}.`);
  return valeur;
}

function entierOuNull(v, { min = 0, max = 1e9, champ = "valeur" } = {}) {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw erreur(400, `${champ} : entier entre ${min} et ${max} attendu.`);
  return n;
}

function dateOuNull(v, champ) {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw erreur(400, `${champ} : date invalide.`);
  return v;
}

/** UPDATE dynamique sur les seules colonnes fournies. */
async function majPartielle(table, id, valeurs, extra = "") {
  const cols = Object.entries(valeurs).filter(([, v]) => v !== undefined);
  if (cols.length === 0) {
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return rows[0] || null;
  }
  const set = cols.map(([c], i) => `${c} = $${i + 2}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE ${table} SET ${set}${extra} WHERE id = $1 RETURNING *`,
    [id, ...cols.map(([, v]) => v)]
  );
  return rows[0] || null;
}

async function ligneOu404(sql, params, message = "Élément introuvable.") {
  const { rows } = await pool.query(sql, params);
  if (!rows[0]) throw erreur(404, message);
  return rows[0];
}

/* ------------------------------------------------------------------ */
/*  Formations (fiches catalogue)                                     */
/* ------------------------------------------------------------------ */

function champsFormation(b = {}) {
  return {
    titre: texte(b.titre, 200),
    resume: texte(b.resume, 600),
    description: texte(b.description, 20000),
    objectifs: texte(b.objectifs, 5000),
    public_cible: texte(b.public_cible, 2000),
    prerequis: texte(b.prerequis, 2000),
    image_url: texte(b.image_url, 500),
    formateur_nom: texte(b.formateur_nom, 200),
    duree_heures: b.duree_heures === undefined ? undefined : b.duree_heures === "" || b.duree_heures === null ? null : Number(b.duree_heures),
    statut: dans(b.statut, ["brouillon", "publiee", "archivee"], undefined),
  };
}

async function slugLibre(base, saufId = null) {
  let slug = slugifier(base);
  for (let i = 2; ; i += 1) {
    const { rows } = await pool.query("SELECT 1 FROM formations WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)", [slug, saufId]);
    if (!rows[0]) return slug;
    slug = `${slugifier(base)}-${i}`;
  }
}

export async function listerFormations(_req, res) {
  const { rows } = await pool.query(
    `SELECT f.*,
            (SELECT COUNT(*)::int FROM formation_sessions s WHERE s.formation_id = f.id) AS nb_sessions,
            (SELECT COUNT(*)::int FROM formation_inscriptions i JOIN formation_sessions s ON s.id = i.session_id
              WHERE s.formation_id = f.id AND i.statut = 'validee') AS nb_inscrits,
            (SELECT COUNT(*)::int FROM formation_inscriptions i JOIN formation_sessions s ON s.id = i.session_id
              WHERE s.formation_id = f.id AND i.statut = 'en_attente') AS nb_en_attente
       FROM formations f ORDER BY f.maj_le DESC`
  );
  res.json({ formations: rows });
}

export async function creerFormation(req, res) {
  const c = champsFormation(req.body);
  if (!c.titre) throw erreur(400, "Le titre est obligatoire.");
  if (c.duree_heures != null && !(c.duree_heures >= 0)) throw erreur(400, "Durée invalide.");
  const slug = await slugLibre(texte(req.body.slug, 80) || c.titre);
  const { rows: [f] } = await pool.query(
    `INSERT INTO formations (slug, titre, resume, description, objectifs, public_cible, prerequis, image_url,
                             formateur_nom, duree_heures, statut, cree_par)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [slug, c.titre, c.resume ?? null, c.description ?? null, c.objectifs ?? null, c.public_cible ?? null, c.prerequis ?? null,
     c.image_url ?? null, c.formateur_nom ?? null, c.duree_heures ?? null, c.statut || "brouillon", req.user.id || null]
  );
  res.status(201).json({ formation: f });
}

export async function lireFormation(req, res) {
  const id = idParam(req);
  const formation = await ligneOu404("SELECT * FROM formations WHERE id = $1", [id], "Formation introuvable.");
  const { rows: sessions } = await pool.query(
    `SELECT s.*,
            (SELECT COUNT(*)::int FROM formation_inscriptions i WHERE i.session_id = s.id AND i.statut = 'validee') AS nb_inscrits,
            (SELECT COUNT(*)::int FROM formation_inscriptions i WHERE i.session_id = s.id AND i.statut = 'en_attente') AS nb_en_attente,
            (SELECT COUNT(*)::int FROM formation_seances se WHERE se.session_id = s.id AND se.statut <> 'annulee') AS nb_seances
       FROM formation_sessions s WHERE s.formation_id = $1 ORDER BY s.date_debut NULLS LAST, s.id`,
    [id]
  );
  res.json({ formation, sessions });
}

export async function modifierFormation(req, res) {
  const id = idParam(req);
  const c = champsFormation(req.body);
  if (c.titre === null) throw erreur(400, "Le titre est obligatoire.");
  if (req.body.slug !== undefined) c.slug = await slugLibre(texte(req.body.slug, 80) || c.titre || "formation", id);
  const f = await majPartielle("formations", id, c, ", maj_le = now()");
  if (!f) throw erreur(404, "Formation introuvable.");
  res.json({ formation: f });
}

export async function supprimerFormation(req, res) {
  const id = idParam(req);
  const { rows: [{ n }] } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM formation_inscriptions i JOIN formation_sessions s ON s.id = i.session_id
      WHERE s.formation_id = $1 AND i.statut IN ('validee', 'en_attente')`,
    [id]
  );
  if (n > 0) throw erreur(409, "Des participants sont inscrits : archivez la formation plutôt que de la supprimer.");
  const { rowCount } = await pool.query("DELETE FROM formations WHERE id = $1", [id]);
  if (!rowCount) throw erreur(404, "Formation introuvable.");
  res.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/*  Sessions                                                          */
/* ------------------------------------------------------------------ */

function champsSession(b = {}) {
  return {
    intitule: texte(b.intitule, 200),
    date_debut: dateOuNull(b.date_debut, "Date de début"),
    date_fin: dateOuNull(b.date_fin, "Date de fin"),
    places_max: entierOuNull(b.places_max, { min: 1, max: 100000, champ: "Places" }),
    tarif_fcfa: b.tarif_fcfa === undefined ? undefined : entierOuNull(b.tarif_fcfa, { min: 0, champ: "Tarif" }) ?? 0,
    mode_inscription: dans(b.mode_inscription, ["automatique", "manuelle"], undefined),
    statut: dans(b.statut, ["ouverte", "fermee", "terminee", "annulee"], undefined),
    seuil_presence: entierOuNull(b.seuil_presence, { min: 0, max: 100, champ: "Seuil de présence" }) ?? undefined,
    seuil_note: entierOuNull(b.seuil_note, { min: 0, max: 100, champ: "Note de réussite" }) ?? undefined,
    regle_absence: dans(b.regle_absence, ["presence", "presence_ou_replay"], undefined),
    replay_telechargeable: booleen(b.replay_telechargeable),
    conservation_replays_jours: entierOuNull(b.conservation_replays_jours, { min: 1, max: 3650, champ: "Conservation" }),
  };
}

export async function creerSession(req, res) {
  const formationId = idParam(req);
  await ligneOu404("SELECT id FROM formations WHERE id = $1", [formationId], "Formation introuvable.");
  const c = champsSession(req.body);
  if (!c.intitule) throw erreur(400, "L'intitulé de la session est obligatoire.");
  const cols = Object.entries(c).filter(([, v]) => v !== undefined);
  const { rows: [s] } = await pool.query(
    `INSERT INTO formation_sessions (formation_id, ${cols.map(([k]) => k).join(", ")})
     VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
    [formationId, ...cols.map(([, v]) => v)]
  );
  res.status(201).json({ session: s });
}

export async function modifierSession(req, res) {
  const id = idParam(req);
  const c = champsSession(req.body);
  if (c.intitule === null) throw erreur(400, "L'intitulé de la session est obligatoire.");
  const s = await majPartielle("formation_sessions", id, c);
  if (!s) throw erreur(404, "Session introuvable.");
  res.json({ session: s });
}

export async function supprimerSession(req, res) {
  const id = idParam(req);
  const { rows: [{ n }] } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM formation_inscriptions WHERE session_id = $1 AND statut IN ('validee', 'en_attente')",
    [id]
  );
  if (n > 0) throw erreur(409, "Des participants sont inscrits : annulez la session plutôt que de la supprimer.");
  const { rowCount } = await pool.query("DELETE FROM formation_sessions WHERE id = $1", [id]);
  if (!rowCount) throw erreur(404, "Session introuvable.");
  res.json({ ok: true });
}

// GET /admin/formations/sessions/:id : tout le contenu d'une session
export async function lireSession(req, res) {
  const id = idParam(req);
  const session = await ligneOu404(
    `SELECT s.*, f.titre AS formation_titre, f.slug AS formation_slug FROM formation_sessions s
       JOIN formations f ON f.id = s.formation_id WHERE s.id = $1`,
    [id],
    "Session introuvable."
  );
  const [seances, inscriptions, supports, replays, evaluations, certificats] = await Promise.all([
    pool.query(
      `SELECT se.*,
              (SELECT COUNT(*)::int FROM formation_presences p WHERE p.seance_id = se.id AND p.duree_secondes > 0) AS nb_presents
         FROM formation_seances se WHERE se.session_id = $1 ORDER BY se.debut`,
      [id]
    ),
    pool.query(
      `SELECT i.*, u.nom, u.prenom, u.email, u.role
         FROM formation_inscriptions i JOIN users u ON u.id = i.user_id
        WHERE i.session_id = $1 ORDER BY i.cree_le`,
      [id]
    ),
    pool.query(
      `SELECT sp.*, f.nom_original, f.taille_octets FROM formation_supports sp
         JOIN formation_fichiers f ON f.id = sp.fichier_id WHERE sp.session_id = $1 ORDER BY sp.cree_le`,
      [id]
    ),
    pool.query(
      `SELECT r.*, se.titre AS seance_titre, f.taille_octets,
              (SELECT COUNT(DISTINCT j.user_id)::int FROM formation_journal j WHERE j.objet_type = 'replay' AND j.objet_id = r.id) AS nb_spectateurs
         FROM formation_replays r JOIN formation_seances se ON se.id = r.seance_id
         LEFT JOIN formation_fichiers f ON f.id = r.fichier_id
        WHERE se.session_id = $1 ORDER BY se.debut, r.id`,
      [id]
    ),
    pool.query(
      `SELECT e.*,
              (SELECT COUNT(*)::int FROM formation_questions q WHERE q.evaluation_id = e.id) AS nb_questions,
              (SELECT COUNT(*)::int FROM formation_tentatives t WHERE t.evaluation_id = e.id) AS nb_tentatives,
              (SELECT COUNT(*)::int FROM formation_tentatives t WHERE t.evaluation_id = e.id AND t.statut = 'soumise') AS nb_a_corriger
         FROM formation_evaluations e WHERE e.session_id = $1 ORDER BY e.ordre, e.id`,
      [id]
    ),
    pool.query(
      `SELECT c.id, c.inscription_id, c.numero, c.delivre_le, c.envoye_le, c.revoque
         FROM formation_certificats c JOIN formation_inscriptions i ON i.id = c.inscription_id
        WHERE i.session_id = $1`,
      [id]
    ),
  ]);
  res.json({
    session,
    seances: seances.rows,
    inscriptions: inscriptions.rows,
    supports: supports.rows,
    replays: replays.rows,
    evaluations: evaluations.rows,
    certificats: certificats.rows,
    visio: { bbb_configure: bbbConfigure(), stockage: FORMATION.stockage.pilote },
  });
}

/* ------------------------------------------------------------------ */
/*  Séances                                                           */
/* ------------------------------------------------------------------ */

function champsSeance(b = {}) {
  const c = {
    titre: texte(b.titre, 200),
    debut: dateOuNull(b.debut, "Début"),
    duree_minutes: entierOuNull(b.duree_minutes, { min: 5, max: 24 * 60, champ: "Durée" }) ?? undefined,
    fournisseur: dans(b.fournisseur, ["bbb", "externe"], undefined),
    lien_externe: texte(b.lien_externe, 1000),
    cameras_participants: booleen(b.cameras_participants),
    statut: dans(b.statut, ["planifiee", "en_cours", "terminee", "annulee"], undefined),
  };
  if (c.lien_externe && !/^https:\/\//i.test(c.lien_externe)) throw erreur(400, "Le lien de la visioconférence doit commencer par https://");
  return c;
}

export async function creerSeance(req, res) {
  const sessionId = idParam(req);
  await ligneOu404("SELECT id FROM formation_sessions WHERE id = $1", [sessionId], "Session introuvable.");
  const c = champsSeance(req.body);
  if (!c.titre || !c.debut) throw erreur(400, "Titre et date de début obligatoires.");
  const cols = Object.entries(c).filter(([, v]) => v !== undefined);
  const { rows: [se] } = await pool.query(
    `INSERT INTO formation_seances (session_id, ${cols.map(([k]) => k).join(", ")})
     VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
    [sessionId, ...cols.map(([, v]) => v)]
  );
  res.status(201).json({ seance: se });
}

export async function modifierSeance(req, res) {
  const id = idParam(req);
  const c = champsSeance(req.body);
  if (c.titre === null || c.debut === null) throw erreur(400, "Titre et date de début obligatoires.");
  const se = await majPartielle("formation_seances", id, c);
  if (!se) throw erreur(404, "Séance introuvable.");
  res.json({ seance: se });
}

export async function supprimerSeance(req, res) {
  const id = idParam(req);
  const { rows: [{ n }] } = await pool.query("SELECT COUNT(*)::int AS n FROM formation_replays WHERE seance_id = $1", [id]);
  if (n > 0) throw erreur(409, "Cette séance a des replays : annulez-la ou supprimez d'abord ses replays.");
  const { rowCount } = await pool.query("DELETE FROM formation_seances WHERE id = $1", [id]);
  if (!rowCount) throw erreur(404, "Séance introuvable.");
  res.json({ ok: true });
}

// POST /admin/formations/seances/:id/demarrer : ouvre la salle et renvoie le lien formateur
export async function demarrerSeance(req, res) {
  const id = idParam(req);
  const se = await ligneOu404(
    `SELECT se.*, f.titre AS formation_titre FROM formation_seances se
       JOIN formation_sessions s ON s.id = se.session_id JOIN formations f ON f.id = s.formation_id
      WHERE se.id = $1`,
    [id],
    "Séance introuvable."
  );
  if (se.statut === "annulee") throw erreur(409, "Séance annulée.");
  let url;
  if (se.fournisseur === "externe") {
    if (!se.lien_externe) throw erreur(409, "Renseignez d'abord le lien de la visioconférence hébergée.");
    url = se.lien_externe;
  } else {
    if (!bbbConfigure()) throw erreur(503, "BigBlueButton n'est pas configuré (BBB_URL et BBB_SECRET dans le .env).");
    if (!se.bbb_meeting_id) {
      se.bbb_meeting_id = identifiantSalle(se);
      await pool.query("UPDATE formation_seances SET bbb_meeting_id = $1 WHERE id = $2", [se.bbb_meeting_id, se.id]);
    }
    await creerSalle({ seance: se, formationTitre: se.formation_titre });
    const { rows: [u] } = await pool.query("SELECT nom, prenom FROM users WHERE id = $1", [req.user.id]);
    const nom = [u?.prenom, u?.nom].filter(Boolean).join(" ") || "Formateur CDO";
    url = lienEntree({ meetingID: se.bbb_meeting_id, nom, userId: req.user.id, moderateur: true });
  }
  await pool.query(
    "UPDATE formation_seances SET statut = 'en_cours', demarree_le = COALESCE(demarree_le, now()), bbb_cree_le = now() WHERE id = $1",
    [id]
  );
  await journaliser(req, "ouverture_salle", "seance", id);
  res.json({ url });
}

// POST /admin/formations/seances/:id/terminer
export async function terminerSeance(req, res) {
  const id = idParam(req);
  const se = await ligneOu404("SELECT * FROM formation_seances WHERE id = $1", [id], "Séance introuvable.");
  if (se.fournisseur === "bbb" && se.bbb_meeting_id && bbbConfigure()) {
    try {
      await terminerSalle(se.bbb_meeting_id);
    } catch (err) {
      console.error("Fin de salle BBB :", err.message);
    }
  }
  const { rows: [maj] } = await pool.query(
    "UPDATE formation_seances SET statut = 'terminee', terminee_le = now() WHERE id = $1 RETURNING *",
    [id]
  );
  res.json({ seance: maj });
}

// POST /admin/formations/seances/:id/synchroniser-replays
export async function synchroniserReplaysSeance(req, res) {
  const id = idParam(req);
  const se = await ligneOu404("SELECT * FROM formation_seances WHERE id = $1", [id], "Séance introuvable.");
  if (se.fournisseur !== "bbb" || !se.bbb_meeting_id) throw erreur(409, "Aucune salle BigBlueButton n'a été ouverte pour cette séance.");
  res.json(await synchroniserReplays(se));
}

// GET /admin/formations/seances/:id/presences
export async function presencesSeance(req, res) {
  const id = idParam(req);
  const se = await ligneOu404("SELECT * FROM formation_seances WHERE id = $1", [id], "Séance introuvable.");
  const { rows } = await pool.query(
    `SELECT i.id AS inscription_id, u.nom, u.prenom, u.email,
            p.premiere_arrivee, p.derniere_sortie, COALESCE(p.duree_secondes, 0) AS duree_secondes, p.source
       FROM formation_inscriptions i JOIN users u ON u.id = i.user_id
       LEFT JOIN formation_presences p ON p.inscription_id = i.id AND p.seance_id = $1
      WHERE i.session_id = $2 AND i.statut = 'validee'
      ORDER BY u.nom NULLS LAST, u.email`,
    [id, se.session_id]
  );
  res.json({ seance: se, presences: rows });
}

// PUT /admin/formations/seances/:id/presences  { presences: [{ inscription_id, minutes }] }
// Saisie manuelle (séance sur un service hébergé, correction d'un relevé)
export async function saisirPresences(req, res) {
  const id = idParam(req);
  const se = await ligneOu404("SELECT * FROM formation_seances WHERE id = $1", [id], "Séance introuvable.");
  const liste = Array.isArray(req.body?.presences) ? req.body.presences : [];
  let n = 0;
  for (const p of liste) {
    const insId = entierPositif(p.inscription_id);
    const minutes = Math.max(0, Math.min(Number(p.minutes) || 0, se.duree_minutes));
    if (!insId) continue;
    const { rowCount } = await pool.query(
      `INSERT INTO formation_presences (seance_id, inscription_id, duree_secondes, source)
       SELECT $1, i.id, $3, 'manuel' FROM formation_inscriptions i WHERE i.id = $2 AND i.session_id = $4
       ON CONFLICT (seance_id, inscription_id) DO UPDATE SET duree_secondes = EXCLUDED.duree_secondes, source = 'manuel', maj_le = now()`,
      [id, insId, Math.round(minutes * 60), se.session_id]
    );
    n += rowCount;
  }
  res.json({ enregistrees: n });
}

/* ------------------------------------------------------------------ */
/*  Inscriptions                                                      */
/* ------------------------------------------------------------------ */

// POST /admin/formations/sessions/:id/inscriptions  { email } : inscrire un compte existant
export async function ajouterParticipant(req, res) {
  const sessionId = idParam(req);
  const email = texte(req.body?.email, 200)?.toLowerCase();
  if (!email) throw erreur(400, "Adresse e-mail obligatoire.");
  const s = await ligneOu404(
    `SELECT s.*, f.titre AS formation_titre FROM formation_sessions s JOIN formations f ON f.id = s.formation_id WHERE s.id = $1`,
    [sessionId],
    "Session introuvable."
  );
  const u = await ligneOu404(
    "SELECT id, email FROM users WHERE lower(email) = $1 AND role IN ('candidat', 'partenaire')",
    [email],
    "Aucun compte candidat ou partenaire avec cette adresse : la personne doit d'abord créer son compte sur le site."
  );
  const { rows: [ins] } = await pool.query(
    `INSERT INTO formation_inscriptions (session_id, user_id, statut, paiement_statut, valide_le)
     VALUES ($1, $2, 'validee', $3, now())
     ON CONFLICT (session_id, user_id) DO UPDATE SET statut = 'validee', valide_le = now()
     RETURNING *`,
    [sessionId, u.id, s.tarif_fcfa > 0 ? "en_attente" : "gratuit"]
  );
  await creerNotification(u.id, "formation_inscription", `Vous êtes inscrit(e) à la formation ${s.formation_titre} (${s.intitule}).`, `/mes-formations/${ins.id}`);
  res.status(201).json({ inscription: ins });
}

// PATCH /admin/formations/inscriptions/:id  { statut?, paiement_statut?, paiement_reference?, admis? }
export async function modifierInscription(req, res) {
  const id = idParam(req);
  const avant = await ligneOu404(
    `SELECT i.*, f.titre AS formation_titre, s.intitule, u.email FROM formation_inscriptions i
       JOIN formation_sessions s ON s.id = i.session_id JOIN formations f ON f.id = s.formation_id
       JOIN users u ON u.id = i.user_id WHERE i.id = $1`,
    [id],
    "Inscription introuvable."
  );
  const b = req.body || {};
  const c = {
    statut: dans(b.statut, ["en_attente", "validee", "refusee", "annulee"], undefined),
    paiement_statut: dans(b.paiement_statut, ["gratuit", "en_attente", "paye"], undefined),
    paiement_reference: texte(b.paiement_reference, 200),
    admis: b.admis === undefined ? undefined : b.admis === null ? null : booleen(b.admis),
  };
  const extra = c.statut === "validee" && avant.statut !== "validee" ? ", valide_le = now()" : "";
  const ins = await majPartielle("formation_inscriptions", id, c, extra);

  if (c.statut && c.statut !== avant.statut && ["validee", "refusee"].includes(c.statut)) {
    const valide = c.statut === "validee";
    const message = valide
      ? `Votre inscription à « ${avant.formation_titre} » (${avant.intitule}) est validée.`
      : `Votre inscription à « ${avant.formation_titre} » (${avant.intitule}) n'a pas été retenue.`;
    await creerNotification(avant.user_id, "formation_inscription", message, `/mes-formations/${id}`);
    envoyerEmail({
      to: avant.email,
      sujet: valide ? "Inscription validée — CDO Tchad" : "Inscription — CDO Tchad",
      titre: avant.formation_titre,
      paragraphes: [message],
      lien: `${FORMATION.siteUrl}/mes-formations/${id}`,
      libelleLien: "Mon espace formation",
    });
  }
  res.json({ inscription: ins });
}

/* ------------------------------------------------------------------ */
/*  Supports et replays                                               */
/* ------------------------------------------------------------------ */

export async function ajouterSupport(req, res) {
  const sessionId = idParam(req);
  if (!req.file) throw erreur(400, "Aucun fichier reçu.");
  await ligneOu404("SELECT id FROM formation_sessions WHERE id = $1", [sessionId], "Session introuvable.");
  const seanceId = entierPositif(req.body?.seance_id);
  const fichier = await enregistrerFichier({
    cheminTemp: req.file.path, nomOriginal: req.file.originalname, typeMime: req.file.mimetype, dossier: `supports/session-${sessionId}`,
  });
  const { rows: [sp] } = await pool.query(
    "INSERT INTO formation_supports (session_id, seance_id, titre, fichier_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [sessionId, seanceId, texte(req.body?.titre, 200) || req.file.originalname, fichier.id]
  );
  res.status(201).json({ support: sp });
}

export async function supprimerSupport(req, res) {
  const id = idParam(req);
  const sp = await ligneOu404("SELECT * FROM formation_supports WHERE id = $1", [id], "Support introuvable.");
  await pool.query("DELETE FROM formation_supports WHERE id = $1", [id]);
  await supprimerFichier(await lireFichier(sp.fichier_id));
  res.json({ ok: true });
}

export async function lienFichierAdmin(req, res) {
  const id = idParam(req);
  const sql = {
    support: "SELECT fichier_id FROM formation_supports WHERE id = $1",
    replay: "SELECT fichier_id FROM formation_replays WHERE id = $1",
    tentative: "SELECT fichier_id FROM formation_tentatives WHERE id = $1",
    certificat: "SELECT fichier_id FROM formation_certificats WHERE id = $1",
  }[req.params.type];
  if (!sql) throw erreur(404, "Type inconnu.");
  const r = await ligneOu404(sql, [id], "Élément introuvable.");
  const fichier = r.fichier_id ? await lireFichier(r.fichier_id) : null;
  if (!fichier) throw erreur(404, "Aucun fichier associé.");
  res.json(await lienTemporaire(fichier, { telecharger: req.query.telecharger === "1", userId: req.user.id }));
}

// POST /admin/formations/seances/:id/replays (dépôt manuel d'une vidéo, ex. enregistrement Zoom)
export async function deposerReplay(req, res) {
  const seanceId = idParam(req);
  if (!req.file) throw erreur(400, "Aucun fichier reçu.");
  const se = await ligneOu404("SELECT * FROM formation_seances WHERE id = $1", [seanceId], "Séance introuvable.");
  const fichier = await enregistrerFichier({
    cheminTemp: req.file.path, nomOriginal: req.file.originalname, typeMime: req.file.mimetype || "video/mp4", dossier: `replays/seance-${seanceId}`,
  });
  const duree = entierOuNull(req.body?.duree_minutes, { min: 1, max: 24 * 60, champ: "Durée" });
  const publie = booleen(req.body?.publie) ?? true;
  const { rows: [r] } = await pool.query(
    `INSERT INTO formation_replays (seance_id, titre, statut, fichier_id, duree_secondes, publie, expire_le)
     VALUES ($1, $2, 'disponible', $3, $4, $5, $6) RETURNING *`,
    [seanceId, texte(req.body?.titre, 200) || se.titre, fichier.id, duree ? duree * 60 : null, publie, await dateExpiration(seanceId)]
  );
  if (publie) await prevenirParticipants(seanceId);
  res.status(201).json({ replay: r });
}

export async function modifierReplay(req, res) {
  const id = idParam(req);
  const r = await majPartielle("formation_replays", id, {
    titre: texte(req.body?.titre, 200),
    publie: booleen(req.body?.publie),
    expire_le: dateOuNull(req.body?.expire_le, "Expiration"),
    duree_secondes: req.body?.duree_minutes === undefined ? undefined : (entierOuNull(req.body.duree_minutes, { min: 1, max: 1440, champ: "Durée" }) ?? 0) * 60 || null,
  });
  if (!r) throw erreur(404, "Replay introuvable.");
  res.json({ replay: r });
}

export async function supprimerReplay(req, res) {
  const id = idParam(req);
  const r = await ligneOu404("SELECT * FROM formation_replays WHERE id = $1", [id], "Replay introuvable.");
  await pool.query("DELETE FROM formation_replays WHERE id = $1", [id]);
  if (r.fichier_id) await supprimerFichier(await lireFichier(r.fichier_id));
  res.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/*  Évaluations                                                       */
/* ------------------------------------------------------------------ */

function champsEvaluation(b = {}) {
  return {
    titre: texte(b.titre, 200),
    type: dans(b.type, ["quiz", "devoir"], undefined),
    consignes: texte(b.consignes, 10000),
    note_reussite: entierOuNull(b.note_reussite, { min: 0, max: 100, champ: "Note de réussite" }),
    essais_max: entierOuNull(b.essais_max, { min: 1, max: 20, champ: "Nombre d'essais" }) ?? undefined,
    date_limite: dateOuNull(b.date_limite, "Date limite"),
    publiee: booleen(b.publiee),
    ordre: entierOuNull(b.ordre, { min: 0, max: 1000, champ: "Ordre" }) ?? undefined,
  };
}

export async function creerEvaluation(req, res) {
  const sessionId = idParam(req);
  await ligneOu404("SELECT id FROM formation_sessions WHERE id = $1", [sessionId], "Session introuvable.");
  const c = champsEvaluation(req.body);
  if (!c.titre) throw erreur(400, "Le titre est obligatoire.");
  const cols = Object.entries(c).filter(([, v]) => v !== undefined);
  const { rows: [e] } = await pool.query(
    `INSERT INTO formation_evaluations (session_id, ${cols.map(([k]) => k).join(", ")})
     VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
    [sessionId, ...cols.map(([, v]) => v)]
  );
  res.status(201).json({ evaluation: e });
}

export async function lireEvaluationAdmin(req, res) {
  const id = idParam(req);
  const evaluation = await ligneOu404(
    `SELECT e.*, s.intitule AS session_intitule, s.formation_id, f.titre AS formation_titre
       FROM formation_evaluations e JOIN formation_sessions s ON s.id = e.session_id
       JOIN formations f ON f.id = s.formation_id WHERE e.id = $1`,
    [id],
    "Évaluation introuvable."
  );
  const [{ rows: questions }, { rows: tentatives }] = await Promise.all([
    pool.query("SELECT * FROM formation_questions WHERE evaluation_id = $1 ORDER BY ordre, id", [id]),
    pool.query(
      `SELECT t.id, t.numero, t.score, t.score_max, t.note_pct, t.statut, t.commentaire, t.soumise_le, t.corrigee_le,
              t.fichier_id IS NOT NULL AS a_un_fichier, t.inscription_id, u.nom, u.prenom, u.email
         FROM formation_tentatives t JOIN formation_inscriptions i ON i.id = t.inscription_id
         JOIN users u ON u.id = i.user_id
        WHERE t.evaluation_id = $1 ORDER BY t.statut DESC, t.soumise_le DESC`,
      [id]
    ),
  ]);
  res.json({ evaluation, questions, tentatives });
}

export async function modifierEvaluation(req, res) {
  const id = idParam(req);
  const c = champsEvaluation(req.body);
  if (c.titre === null) throw erreur(400, "Le titre est obligatoire.");
  const e = await majPartielle("formation_evaluations", id, c);
  if (!e) throw erreur(404, "Évaluation introuvable.");
  res.json({ evaluation: e });
}

export async function supprimerEvaluation(req, res) {
  const id = idParam(req);
  const { rows: [{ n }] } = await pool.query("SELECT COUNT(*)::int AS n FROM formation_tentatives WHERE evaluation_id = $1", [id]);
  if (n > 0 && req.query.forcer !== "1") throw erreur(409, "Des participants ont déjà répondu : dépubliez l'évaluation, ou confirmez la suppression.");
  const { rowCount } = await pool.query("DELETE FROM formation_evaluations WHERE id = $1", [id]);
  if (!rowCount) throw erreur(404, "Évaluation introuvable.");
  res.json({ ok: true });
}

// PUT /admin/formations/evaluations/:id/questions  { questions: [...] } : remplace la liste
export async function enregistrerQuestions(req, res) {
  const id = idParam(req);
  await ligneOu404("SELECT id FROM formation_evaluations WHERE id = $1", [id], "Évaluation introuvable.");
  const liste = Array.isArray(req.body?.questions) ? req.body.questions : null;
  if (!liste) throw erreur(400, "Liste de questions attendue.");

  const propres = liste.map((q, i) => {
    const type = dans(q.type, ["qcm", "vrai_faux", "reponse_courte"], "qcm");
    const enonce = texte(q.enonce, 2000);
    if (!enonce) throw erreur(400, `Question ${i + 1} : énoncé manquant.`);
    let options = type === "vrai_faux" ? ["Vrai", "Faux"] : type === "qcm" ? (q.options || []).map((o) => texte(o, 500)).filter(Boolean) : [];
    let bonnes = Array.isArray(q.bonnes_reponses) ? q.bonnes_reponses : [];
    if (type === "reponse_courte") {
      bonnes = bonnes.map((r) => texte(r, 300)).filter(Boolean);
      if (!bonnes.length) throw erreur(400, `Question ${i + 1} : indiquez au moins une réponse acceptée.`);
    } else {
      if (type === "qcm" && options.length < 2) throw erreur(400, `Question ${i + 1} : au moins deux choix.`);
      bonnes = [...new Set(bonnes.map(Number))].filter((n) => Number.isInteger(n) && n >= 0 && n < options.length);
      if (!bonnes.length) throw erreur(400, `Question ${i + 1} : cochez la ou les bonnes réponses.`);
      if (type === "vrai_faux") bonnes = bonnes.slice(0, 1);
    }
    const points = Number(q.points) > 0 ? Number(q.points) : 1;
    return { type, enonce, options, bonnes, points, explication: texte(q.explication, 2000), ordre: i };
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM formation_questions WHERE evaluation_id = $1", [id]);
    for (const q of propres) {
      await client.query(
        `INSERT INTO formation_questions (evaluation_id, type, enonce, options, bonnes_reponses, points, explication, ordre)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, q.type, q.enonce, JSON.stringify(q.options), JSON.stringify(q.bonnes), q.points, q.explication, q.ordre]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  const { rows } = await pool.query("SELECT * FROM formation_questions WHERE evaluation_id = $1 ORDER BY ordre, id", [id]);
  res.json({ questions: rows });
}

// PATCH /admin/formations/tentatives/:id  { note_pct, commentaire } : correction d'un devoir
export async function corrigerTentative(req, res) {
  const id = idParam(req);
  const note = Number(req.body?.note_pct);
  if (!(note >= 0 && note <= 100)) throw erreur(400, "Note sur 100 attendue.");
  const { rows: [t] } = await pool.query(
    `UPDATE formation_tentatives SET note_pct = $2, score = $2, score_max = 100, statut = 'corrigee',
            commentaire = COALESCE($3, commentaire), corrigee_le = now()
      WHERE id = $1 RETURNING *`,
    [id, note, texte(req.body?.commentaire, 4000) ?? null]
  );
  if (!t) throw erreur(404, "Copie introuvable.");
  const { rows: [info] } = await pool.query(
    `SELECT i.user_id, e.titre FROM formation_inscriptions i JOIN formation_evaluations e ON e.id = $2 WHERE i.id = $1`,
    [t.inscription_id, t.evaluation_id]
  );
  if (info) await creerNotification(info.user_id, "formation_devoir", `Votre devoir « ${info.titre} » a été corrigé.`, `/mes-formations/${t.inscription_id}`);
  res.json({ tentative: t });
}

/* ------------------------------------------------------------------ */
/*  Résultats et certificats                                          */
/* ------------------------------------------------------------------ */

export async function resultatsSession(req, res) {
  const id = idParam(req);
  const r = await calculerResultatsSession(id);
  if (!r) throw erreur(404, "Session introuvable.");
  res.json(r);
}

// POST /admin/formations/sessions/:id/resultats/calculer : enregistre présence, note et admission calculées
export async function calculerResultats(req, res) {
  const id = idParam(req);
  const r = await calculerResultatsSession(id, { enregistrer: true });
  if (!r) throw erreur(404, "Session introuvable.");
  res.json(r);
}

// POST /admin/formations/sessions/:id/resultats/publier
export async function publierResultats(req, res) {
  const id = idParam(req);
  const s = await ligneOu404(
    `SELECT s.*, f.titre AS formation_titre FROM formation_sessions s JOIN formations f ON f.id = s.formation_id WHERE s.id = $1`,
    [id],
    "Session introuvable."
  );
  const { rows: [{ n }] } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM formation_inscriptions WHERE session_id = $1 AND statut = 'validee' AND admis IS NULL",
    [id]
  );
  if (n > 0) throw erreur(409, "Calculez d'abord les résultats (certains participants n'ont pas encore de décision).");
  await pool.query("UPDATE formation_sessions SET resultats_publies_le = now() WHERE id = $1", [id]);
  const { rows } = await pool.query(
    "SELECT id, user_id, admis FROM formation_inscriptions WHERE session_id = $1 AND statut = 'validee'",
    [id]
  );
  for (const i of rows) {
    await creerNotification(
      i.user_id,
      "formation_resultats",
      i.admis
        ? `Résultats publiés : vous êtes admis(e) à « ${s.formation_titre} ». Votre certificat sera bientôt disponible.`
        : `Résultats publiés pour « ${s.formation_titre} » : consultez votre espace.`,
      `/mes-formations/${i.id}`
    );
  }
  res.json({ ok: true, notifies: rows.length });
}

async function delivrerCertificat(insId) {
  const { rows: [d] } = await pool.query(
    `SELECT i.id, i.user_id, i.note_finale, i.presence_pct, u.nom, u.prenom, u.email,
            s.id AS session_id, s.intitule, s.date_debut, s.date_fin, f.titre, f.duree_heures
       FROM formation_inscriptions i JOIN users u ON u.id = i.user_id
       JOIN formation_sessions s ON s.id = i.session_id JOIN formations f ON f.id = s.formation_id
      WHERE i.id = $1`,
    [insId]
  );
  const numero = nouveauNumero(insId);
  const delivreLe = new Date();
  const pdf = await genererCertificatPDF({
    numero,
    participant: d,
    formation: { titre: d.titre, duree_heures: d.duree_heures },
    session: d,
    noteFinale: d.note_finale,
    presencePct: d.presence_pct,
    delivreLe,
  });
  const fichier = await enregistrerTampon({
    tampon: pdf, nomOriginal: `Certificat-${numero}.pdf`, typeMime: "application/pdf", dossier: `certificats/session-${d.session_id}`,
  });
  const { rows: [c] } = await pool.query(
    `INSERT INTO formation_certificats (inscription_id, numero, fichier_id, delivre_le) VALUES ($1, $2, $3, $4)
     ON CONFLICT (inscription_id) DO UPDATE SET numero = EXCLUDED.numero, fichier_id = EXCLUDED.fichier_id,
       delivre_le = EXCLUDED.delivre_le, revoque = false, revoque_le = NULL, motif_revocation = NULL
     RETURNING *`,
    [insId, numero, fichier.id, delivreLe]
  );
  return { certificat: c, pdf, participant: d };
}

async function envoyerCertificat({ certificat, pdf, participant }) {
  const ok = await envoyerEmail({
    to: participant.email,
    sujet: `Votre certificat — ${participant.titre}`,
    titre: "Félicitations !",
    paragraphes: [
      `Vous avez réussi la formation « ${participant.titre} » (${participant.intitule}).`,
      `Votre certificat n° ${certificat.numero} est joint à ce message. Il reste téléchargeable dans votre espace et vérifiable en ligne.`,
    ],
    lien: urlVerification(certificat.numero),
    libelleLien: "Vérifier le certificat",
    piecesJointes: [{ filename: `Certificat-${certificat.numero}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  if (ok) await pool.query("UPDATE formation_certificats SET envoye_le = now() WHERE id = $1", [certificat.id]);
  return ok;
}

// POST /admin/formations/sessions/:id/certificats  { limite? } : délivre par lots (limites cPanel)
export async function genererCertificats(req, res) {
  const id = idParam(req);
  const s = await ligneOu404("SELECT * FROM formation_sessions WHERE id = $1", [id], "Session introuvable.");
  if (!s.resultats_publies_le) throw erreur(409, "Publiez d'abord les résultats de la session.");
  const limite = Math.min(entierPositif(req.body?.limite) || 20, 200);
  const { rows: admis } = await pool.query(
    `SELECT i.id FROM formation_inscriptions i
      WHERE i.session_id = $1 AND i.statut = 'validee' AND i.admis
        AND NOT EXISTS (SELECT 1 FROM formation_certificats c WHERE c.inscription_id = i.id AND NOT c.revoque)
      ORDER BY i.id`,
    [id]
  );
  const lot = admis.slice(0, limite);
  let envoyes = 0;
  for (const a of lot) {
    const r = await delivrerCertificat(a.id);
    if (await envoyerCertificat(r)) envoyes += 1;
    await creerNotification(r.participant.user_id, "formation_certificat", `Votre certificat n° ${r.certificat.numero} est disponible.`, `/mes-formations/${a.id}`);
  }
  await journaliser(req, "generation_certificats", "session", id);
  res.json({ delivres: lot.length, envoyes, restants: admis.length - lot.length });
}

export async function renvoyerCertificat(req, res) {
  const id = idParam(req);
  const c = await ligneOu404("SELECT * FROM formation_certificats WHERE id = $1 AND NOT revoque", [id], "Certificat introuvable.");
  const fichier = await lireFichier(c.fichier_id);
  if (!fichier) throw erreur(404, "Fichier du certificat introuvable.");
  const { rows: [p] } = await pool.query(
    `SELECT u.email, f.titre, s.intitule FROM formation_inscriptions i JOIN users u ON u.id = i.user_id
       JOIN formation_sessions s ON s.id = i.session_id JOIN formations f ON f.id = s.formation_id WHERE i.id = $1`,
    [c.inscription_id]
  );
  const lien = await lienTemporaire(fichier, { telecharger: true, userId: req.user.id });
  const ok = await envoyerEmail({
    to: p.email,
    sujet: `Votre certificat — ${p.titre}`,
    titre: "Votre certificat",
    paragraphes: [`Certificat n° ${c.numero} — ${p.titre} (${p.intitule}). Il est téléchargeable dans votre espace formation.`],
    lien: `${FORMATION.siteUrl}/mes-formations/${c.inscription_id}`,
    libelleLien: "Mon espace formation",
  });
  if (ok) await pool.query("UPDATE formation_certificats SET envoye_le = now() WHERE id = $1", [id]);
  res.json({ envoye: ok, lien });
}

export async function revoquerCertificat(req, res) {
  const id = idParam(req);
  const { rows: [c] } = await pool.query(
    "UPDATE formation_certificats SET revoque = true, revoque_le = now(), motif_revocation = $2 WHERE id = $1 RETURNING *",
    [id, texte(req.body?.motif, 500) ?? null]
  );
  if (!c) throw erreur(404, "Certificat introuvable.");
  await journaliser(req, "revocation_certificat", "certificat", id);
  res.json({ certificat: c });
}

/* ------------------------------------------------------------------ */
/*  Tableau de bord, exports, journal                                 */
/* ------------------------------------------------------------------ */

export async function tableauDeBord(_req, res) {
  const [{ rows: [chiffres] }, { rows: prochaines }, { rows: dernieres }, { rows: parFormation }] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM formations WHERE statut = 'publiee') AS formations_publiees,
         (SELECT COUNT(*)::int FROM formation_sessions WHERE statut = 'ouverte') AS sessions_ouvertes,
         (SELECT COUNT(*)::int FROM formation_inscriptions WHERE statut = 'validee') AS inscrits,
         (SELECT COUNT(*)::int FROM formation_inscriptions WHERE statut = 'en_attente') AS en_attente,
         (SELECT COUNT(*)::int FROM formation_certificats WHERE NOT revoque) AS certificats,
         (SELECT COUNT(*)::int FROM formation_tentatives WHERE statut = 'soumise') AS devoirs_a_corriger,
         (SELECT ROUND(AVG(presence_pct), 1) FROM formation_inscriptions WHERE presence_pct IS NOT NULL) AS presence_moyenne,
         (SELECT ROUND(AVG(note_finale), 1) FROM formation_inscriptions WHERE note_finale IS NOT NULL) AS note_moyenne,
         (SELECT COUNT(*)::int FROM formation_journal WHERE action LIKE 'lecture_replay%' AND cree_le > now() - interval '30 days') AS lectures_replays_30j`
    ),
    pool.query(
      `SELECT se.id, se.titre, se.debut, se.duree_minutes, se.fournisseur, se.statut, s.id AS session_id, s.intitule,
              f.id AS formation_id, f.titre AS formation_titre,
              (SELECT COUNT(*)::int FROM formation_inscriptions i WHERE i.session_id = s.id AND i.statut = 'validee') AS inscrits
         FROM formation_seances se JOIN formation_sessions s ON s.id = se.session_id JOIN formations f ON f.id = s.formation_id
        WHERE se.statut IN ('planifiee', 'en_cours') AND se.debut + make_interval(mins => se.duree_minutes) > now()
        ORDER BY se.debut LIMIT 8`
    ),
    pool.query(
      `SELECT i.id, i.statut, i.paiement_statut, i.cree_le, u.nom, u.prenom, u.email, s.id AS session_id, s.intitule,
              f.id AS formation_id, f.titre AS formation_titre
         FROM formation_inscriptions i JOIN users u ON u.id = i.user_id
         JOIN formation_sessions s ON s.id = i.session_id JOIN formations f ON f.id = s.formation_id
        ORDER BY i.cree_le DESC LIMIT 10`
    ),
    pool.query(
      `SELECT f.id, f.titre,
              COUNT(i.*) FILTER (WHERE i.statut = 'validee')::int AS inscrits,
              COUNT(i.*) FILTER (WHERE i.admis)::int AS admis,
              (SELECT COUNT(*)::int FROM formation_certificats c JOIN formation_inscriptions i2 ON i2.id = c.inscription_id
                 JOIN formation_sessions s2 ON s2.id = i2.session_id WHERE s2.formation_id = f.id AND NOT c.revoque) AS certificats
         FROM formations f LEFT JOIN formation_sessions s ON s.formation_id = f.id
         LEFT JOIN formation_inscriptions i ON i.session_id = s.id
        GROUP BY f.id ORDER BY inscrits DESC, f.titre LIMIT 12`
    ),
  ]);
  res.json({ chiffres, prochaines_seances: prochaines, dernieres_inscriptions: dernieres, par_formation: parFormation });
}

const csv = (v) => {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// GET /admin/formations/sessions/:id/export.csv
export async function exporterSessionCsv(req, res) {
  const id = idParam(req);
  const s = await ligneOu404(
    `SELECT s.*, f.titre FROM formation_sessions s JOIN formations f ON f.id = s.formation_id WHERE s.id = $1`,
    [id],
    "Session introuvable."
  );
  const calc = await calculerResultatsSession(id);
  const { rows: ins } = await pool.query(
    `SELECT i.id, i.statut, i.paiement_statut, i.paiement_reference, i.cree_le, i.admis,
            c.numero AS certificat, c.revoque
       FROM formation_inscriptions i LEFT JOIN formation_certificats c ON c.inscription_id = i.id
      WHERE i.session_id = $1`,
    [id]
  );
  const parId = new Map(ins.map((i) => [i.id, i]));
  const entetes = ["Nom", "Prénom", "E-mail", "Présence (%)", "Note finale (%)", "Admis (calcul)", "Admis (décision)", "Paiement", "Référence paiement", "Certificat"];
  const lignes = calc.lignes.map((l) => {
    const i = parId.get(l.inscription_id) || {};
    return [l.nom, l.prenom, l.email, l.presence_pct, l.note_finale, l.admis_calcule ? "oui" : "non",
      i.admis == null ? "" : i.admis ? "oui" : "non", i.paiement_statut, i.paiement_reference,
      i.certificat ? `${i.certificat}${i.revoque ? " (révoqué)" : ""}` : ""];
  });
  const contenu = "﻿" + [entetes, ...lignes].map((l) => l.map(csv).join(";")).join("\r\n");
  const nom = `participants-${s.titre}-${s.intitule}`.normalize("NFD").replace(/[^\w-]+/g, "-").slice(0, 100);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nom}.csv"`);
  res.send(contenu);
}

// GET /admin/formations/journal?session=ID&limite=200
export async function journal(req, res) {
  const sessionId = entierPositif(req.query.session);
  const limite = Math.min(entierPositif(req.query.limite) || 200, 1000);
  const { rows } = await pool.query(
    `SELECT j.*, u.nom, u.prenom, u.email FROM formation_journal j LEFT JOIN users u ON u.id = j.user_id
      WHERE ($1::int IS NULL OR
             (j.objet_type = 'seance' AND j.objet_id IN (SELECT id FROM formation_seances WHERE session_id = $1)) OR
             (j.objet_type = 'replay' AND j.objet_id IN (SELECT r.id FROM formation_replays r JOIN formation_seances se ON se.id = r.seance_id WHERE se.session_id = $1)) OR
             (j.objet_type = 'support' AND j.objet_id IN (SELECT id FROM formation_supports WHERE session_id = $1)) OR
             (j.objet_type = 'session' AND j.objet_id = $1))
      ORDER BY j.cree_le DESC LIMIT $2`,
    [sessionId, limite]
  );
  res.json({ journal: rows });
}
