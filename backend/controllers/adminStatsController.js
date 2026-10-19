// 📁 controllers/adminStatsController.js
// Statistiques de l'administration.
//  - /admin/stats/resume  : tableau de bord (offres publiées et candidatures de la période)
//  - /admin/stats/premium : analyse détaillée des avis de recrutement
//
// Les offres sont comptées sur leur date de publication, les candidatures sur leur date
// de dépôt. Les brouillons et les avis de partenaires non validés ne sont jamais comptés
// dans les analyses d'offres : ils ne sont pas (ou pas encore) parus sur le site.
import { pool } from "../config/db.js";

const OFFRE_PARUE = `LOWER(COALESCE(o.statut, 'publiee')) <> 'brouillon'
                 AND COALESCE(o.statut_moderation, 'validee') = 'validee'`;

const deux = (n) => String(n).padStart(2, "0");
const MOIS = Array.from({ length: 12 }, (_, i) => deux(i + 1));

// ---------------------------------------------------------------- outils communs
function lirePeriode(query) {
  const anneeCourante = new Date().getFullYear();
  const annee = /^\d{4}$/.test(String(query.year || "")) ? Number(query.year) : anneeCourante;
  const mois = /^(0?[1-9]|1[0-2])$/.test(String(query.month || "")) ? deux(Number(query.month)) : null;
  return { annee, mois };
}

// Condition SQL « colonne dans la période » ; `params` reçoit l'année puis, s'il y en a un, le mois.
function conditionPeriode(colonne, { annee, mois }, params) {
  params.push(annee);
  let sql = `EXTRACT(YEAR FROM ${colonne}) = $${params.length}::int`;
  if (mois) {
    params.push(Number(mois));
    sql += ` AND EXTRACT(MONTH FROM ${colonne}) = $${params.length}::int`;
  }
  return sql;
}

// Regroupe des libellés saisis à la main qui ne diffèrent que par les accents, la casse ou
// l'apostrophe (« N'Djamena », « N’Djaména »…). Le libellé affiché est la forme la plus fréquente.
const cle = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function regrouper(lignes, champ, vide = "Non précisé") {
  const groupes = new Map();
  for (const l of lignes) {
    const brut = String(l[champ] ?? "").trim();
    const k = cle(brut) || "";
    const total = Number(l.total) || 0;
    const g = groupes.get(k) || { total: 0, formes: new Map() };
    g.total += total;
    g.formes.set(brut, (g.formes.get(brut) || 0) + total);
    groupes.set(k, g);
  }
  return [...groupes.entries()]
    .map(([k, g]) => {
      const forme = [...g.formes.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0];
      return { [champ]: k ? forme : vide, total: g.total };
    })
    .sort((a, b) => b.total - a.total || String(a[champ]).localeCompare(String(b[champ]), "fr"));
}

const douzeMois = (lignes) => MOIS.map((m) => ({ mois: m, total: lignes.find((l) => l.mois === m)?.total || 0 }));

async function anneesDisponibles() {
  const { rows } = await pool.query(
    `SELECT DISTINCT a FROM (
        SELECT EXTRACT(YEAR FROM date_publication)::int AS a FROM offres WHERE date_publication IS NOT NULL
        UNION
        SELECT EXTRACT(YEAR FROM date_candidature)::int FROM candidatures WHERE date_candidature IS NOT NULL
     ) t WHERE a IS NOT NULL`
  );
  const annees = new Set(rows.map((r) => r.a));
  annees.add(new Date().getFullYear());
  return [...annees].sort((a, b) => b - a);
}

// ---------------------------------------------------------------- compteurs simples (inchangés)
export async function getAdminStats(_req, res) {
  try {
    const [offres, cands, users, news] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM offres"),
      pool.query("SELECT COUNT(*)::int AS n FROM candidatures"),
      pool.query("SELECT COUNT(*)::int AS n FROM users WHERE role NOT IN ('admin','superadmin')"),
      pool.query("SELECT COUNT(*)::int AS n FROM actualites"),
    ]);
    res.json({
      total_offres: offres.rows[0].n,
      total_candidatures: cands.rows[0].n,
      total_utilisateurs: users.rows[0].n,
      total_actualites: news.rows[0].n,
    });
  } catch (err) {
    console.error("❌ [ADMIN/STATS] Error:", err);
    res.status(500).json({ error: "STATS_FAILED", details: err.message });
  }
}

export async function getCandidaturesParMois(req, res) {
  const year = String(req.query.year || new Date().getFullYear());
  try {
    const { rows } = await pool.query(
      `SELECT TO_CHAR(date_trunc('month', date_candidature), 'YYYY-MM') AS mois,
              COUNT(*)::int AS total
         FROM candidatures
        WHERE EXTRACT(YEAR FROM date_candidature) = $1::int
     GROUP BY 1
     ORDER BY 1 ASC`,
      [year]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ [ADMIN/STATS/mois] Error:", err);
    res.status(500).json({ error: "STATS_MONTH_FAILED", details: err.message });
  }
}

// ---------------------------------------------------------------- tableau de bord
export async function getAdminStatsResume(req, res) {
  const periode = lirePeriode(req.query);
  const { annee, mois } = periode;

  try {
    const pOffres = [];
    const offresDansPeriode = conditionPeriode("o.date_publication", periode, pOffres);
    const pCands = [];
    const candsDansPeriode = conditionPeriode("c.date_candidature", periode, pCands);

    const [
      totaux,
      offresParMois,
      offresParEmployeur,
      offresParContrat,
      offresParLieu,
      offresParEtat,
      candsParMois,
      candsParOffre,
      candsParStatut,
      candsParContrat,
      candsParLieu,
      candsParEmployeur,
      comparaison,
      derniere,
      annees,
    ] = await Promise.all([
      pool.query(
        `SELECT (SELECT COUNT(*)::int FROM offres) AS offres,
                (SELECT COUNT(*)::int FROM offres o WHERE ${OFFRE_PARUE}) AS offres_parues,
                (SELECT COUNT(*)::int FROM offres WHERE LOWER(COALESCE(statut, '')) = 'brouillon') AS brouillons,
                (SELECT COUNT(*)::int FROM candidatures) AS candidatures,
                (SELECT COUNT(*)::int FROM users WHERE role NOT IN ('admin','superadmin')) AS utilisateurs,
                (SELECT COUNT(*)::int FROM actualites) AS actualites`
      ),
      pool.query(
        `SELECT TO_CHAR(o.date_publication, 'MM') AS mois, COUNT(*)::int AS total
           FROM offres o
          WHERE ${OFFRE_PARUE} AND EXTRACT(YEAR FROM o.date_publication) = $1::int
       GROUP BY 1`,
        [annee]
      ),
      pool.query(
        `SELECT o.employeur, COUNT(*)::int AS total FROM offres o
          WHERE ${OFFRE_PARUE} AND ${offresDansPeriode} GROUP BY 1`,
        pOffres
      ),
      pool.query(
        `SELECT o.type_contrat, COUNT(*)::int AS total FROM offres o
          WHERE ${OFFRE_PARUE} AND ${offresDansPeriode} GROUP BY 1`,
        pOffres
      ),
      pool.query(
        `SELECT o.lieu, COUNT(*)::int AS total FROM offres o
          WHERE ${OFFRE_PARUE} AND ${offresDansPeriode} GROUP BY 1`,
        pOffres
      ),
      pool.query(
        `SELECT CASE
                  WHEN LOWER(COALESCE(o.statut, '')) = 'suspendue' THEN 'Suspendue'
                  WHEN LOWER(COALESCE(o.statut, '')) IN ('cloturee', 'clôturée') THEN 'Clôturée'
                  WHEN o.date_limite IS NOT NULL AND o.date_limite < CURRENT_DATE THEN 'Expirée'
                  ELSE 'Ouverte'
                END AS etat,
                COUNT(*)::int AS total
           FROM offres o
          WHERE ${OFFRE_PARUE} AND ${offresDansPeriode}
       GROUP BY 1`,
        pOffres
      ),
      pool.query(
        `SELECT TO_CHAR(c.date_candidature, 'MM') AS mois, COUNT(*)::int AS total
           FROM candidatures c
          WHERE EXTRACT(YEAR FROM c.date_candidature) = $1::int
       GROUP BY 1`,
        [annee]
      ),
      pool.query(
        `SELECT o.titre, COUNT(c.id)::int AS total
           FROM candidatures c JOIN offres o ON o.id = c.offre_id
          WHERE ${candsDansPeriode}
       GROUP BY o.id, o.titre
       ORDER BY total DESC, o.titre
          LIMIT 10`,
        pCands
      ),
      pool.query(
        `SELECT c.statut, COUNT(*)::int AS total FROM candidatures c WHERE ${candsDansPeriode} GROUP BY 1`,
        pCands
      ),
      pool.query(
        `SELECT o.type_contrat, COUNT(c.id)::int AS total
           FROM candidatures c JOIN offres o ON o.id = c.offre_id
          WHERE ${candsDansPeriode} GROUP BY 1`,
        pCands
      ),
      pool.query(
        `SELECT o.lieu, COUNT(c.id)::int AS total
           FROM candidatures c JOIN offres o ON o.id = c.offre_id
          WHERE ${candsDansPeriode} GROUP BY 1`,
        pCands
      ),
      pool.query(
        `SELECT o.employeur, COUNT(c.id)::int AS total
           FROM candidatures c JOIN offres o ON o.id = c.offre_id
          WHERE ${candsDansPeriode} GROUP BY 1`,
        pCands
      ),
      pool.query(
        `SELECT EXTRACT(YEAR FROM date_candidature)::text AS annee,
                TO_CHAR(date_candidature, 'MM') AS mois,
                COUNT(*)::int AS total
           FROM candidatures
          WHERE EXTRACT(YEAR FROM date_candidature) IN ($1::int, $2::int)
       GROUP BY 1, 2`,
        [annee - 1, annee]
      ),
      pool.query(`SELECT MAX(date_candidature) AS d FROM candidatures`),
      anneesDisponibles(),
    ]);

    // Actualités par catégorie : année demandée, sinon toutes années confondues
    let actualitesScope = "year";
    let actualites = await pool.query(
      `SELECT COALESCE(categorie, 'Non renseignée') AS categorie, COUNT(*)::int AS total
         FROM actualites
        WHERE EXTRACT(YEAR FROM date_publication) = $1::int
     GROUP BY 1 ORDER BY total DESC`,
      [annee]
    );
    if (actualites.rowCount === 0) {
      actualites = await pool.query(
        `SELECT COALESCE(categorie, 'Non renseignée') AS categorie, COUNT(*)::int AS total
           FROM actualites GROUP BY 1 ORDER BY total DESC`
      );
      actualitesScope = "all";
    }

    const t = totaux.rows[0];
    const offresPeriode = offresParEmployeur.rows.reduce((s, l) => s + l.total, 0);
    const candsPeriode = candsParStatut.rows.reduce((s, l) => s + l.total, 0);
    const d = derniere.rows[0]?.d;

    res.json({
      // --- période et totaux
      annees,
      periode: {
        annee,
        mois,
        offres: offresPeriode,
        candidatures: candsPeriode,
        employeurs: regrouper(offresParEmployeur.rows, "employeur").length,
      },
      total_offres: t.offres,
      total_offres_parues: t.offres_parues,
      total_brouillons: t.brouillons,
      total_candidatures: t.candidatures,
      total_utilisateurs: t.utilisateurs,
      total_actualites: t.actualites,
      derniere_candidature: d ? `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}` : null,

      // --- offres parues sur la période
      offres_par_mois: douzeMois(offresParMois.rows),
      offres_par_employeur: regrouper(offresParEmployeur.rows, "employeur"),
      offres_par_type_contrat: regrouper(offresParContrat.rows, "type_contrat"),
      offres_par_lieu: regrouper(offresParLieu.rows, "lieu").slice(0, 5),
      offres_par_etat: offresParEtat.rows.sort((a, b) => b.total - a.total),

      // --- candidatures reçues sur la période
      candidatures_par_mois: douzeMois(candsParMois.rows),
      candidatures_par_offre: candsParOffre.rows,
      candidatures_par_statut: candsParStatut.rows.sort((a, b) => b.total - a.total),
      par_type_contrat: regrouper(candsParContrat.rows, "type_contrat"),
      par_lieu: regrouper(candsParLieu.rows, "lieu").slice(0, 5),
      par_employeur: regrouper(candsParEmployeur.rows, "employeur"),
      multi_year_data: comparaison.rows,
      annee_precedente: annee - 1,

      // --- actualités
      actualites_par_categorie: actualites.rows,
      actualites_scope: actualitesScope,
      actualites_year: String(annee),
    });
  } catch (err) {
    console.error("❌ [ADMIN/STATS/resume] Error:", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "STATS_RESUME_FAILED", details: err.message });
  }
}

// ---------------------------------------------------------------- analyse premium
// Tout ce qui suit est déduit du texte des avis (titre, diplôme, expérience, compétences…).
// Ce sont des lectures automatiques : elles donnent des ordres de grandeur, pas une saisie exacte.

const FAMILLES = [
  ["Informatique et données", /r[ée]seau|infrastructure|informati|applicati|\bdata\b|d[ée]veloppeur|syst[èe]mes? d.information/i],
  ["Audit et contrôle", /audit/i],
  ["Risques et crédit", /risque|\brisk\b|cr[ée]dit|engagement/i],
  ["Finance et comptabilité", /financ|comptab|reporting|tr[ée]sorerie|r[ée]glementaire/i],
  ["Opérations bancaires", /compensation|op[ée]rations|back.?office/i],
  ["Commercial et relation client", /commercial|corporate|client[èe]le|vente|marketing/i],
  ["Administration et support", /administrat|assistant|ressources humaines|archiv|logisti|communication/i],
];
const familleDe = (titre) => FAMILLES.find(([, re]) => re.test(titre || ""))?.[0] || "Autres métiers";

const ENCADREMENT = /\b(chef|responsable|directeur|directrice|manager|head|superviseur|senior)\b/i;
const responsabiliteDe = (titre) => (ENCADREMENT.test(titre || "") ? "Encadrement" : "Expertise et exécution");

function niveauEtudes(o) {
  const texte = [o.diplome, o.formation].filter(Boolean).join(" ");
  const m = texte.match(/bac\s*\+\s*(\d)/i);
  if (m) return Number(m[1]);
  if (/master|ing[ée]nieur|dscg/i.test(texte)) return 5;
  if (/ma[îi]trise/i.test(texte)) return 4;
  if (/licence|bachelor/i.test(texte)) return 3;
  return null;
}

function anneesExperience(o) {
  const lire = (t) => {
    if (!t) return null;
    const seul = String(t).trim().match(/^(\d{1,2})$/);
    if (seul) return Number(seul[1]);
    const m =
      String(t).match(/(\d{1,2})\s*(?:[àa\-\/]\s*\d{1,2}\s*)?ans?\b/i) ||
      String(t).match(/(?:minimum|au moins|min\.?)\s*(?:de\s*)?(\d{1,2})\b/i);
    return m ? Number(m[1]) : null;
  };
  return lire(o.experience) ?? lire(o.diplome) ?? null;
}

const trancheExperience = (n) =>
  n == null ? "Non précisée" : n < 3 ? "Moins de 3 ans" : n < 5 ? "3 à 4 ans" : n < 8 ? "5 à 7 ans" : "8 ans et plus";
const ORDRE_TRANCHES = ["Moins de 3 ans", "3 à 4 ans", "5 à 7 ans", "8 ans et plus", "Non précisée"];

const COMPETENCES = [
  ["Reporting", /reporting/i],
  ["Excel", /excel/i],
  ["Réglementation COBAC / BEAC", /cobac|beac/i],
  ["Gestion des risques", /risque/i],
  ["Comptabilité", /comptab/i],
  ["Analyse financière", /analyse financi/i],
  ["Audit et contrôle interne", /audit|contr[ôo]le interne/i],
  ["Crédit bancaire", /cr[ée]dit/i],
  ["Normes IFRS", /ifrs/i],
  ["Encadrement d'équipe", /encadr|leadership|manag|former et [ée]valuer|coordonner une [ée]quipe/i],
  ["Trésorerie", /tr[ée]sorerie/i],
  ["Systèmes bancaires (Flexcube, T24, Amplitude…)", /flexcub|\bt24\b|amplitude|finacle|core banking|syst[èe]mes? bancaires?/i],
  ["Bases de données et SQL", /\bsql\b|bases? de donn[ée]es|oracle/i],
  ["Power BI et tableaux de bord", /power\s?bi|tableaux? de bord/i],
  ["Programmation (VBA, Python, Java…)", /\bvba\b|python|\bjava\b/i],
  ["Normes de Bâle", /b[âa]le\b/i],
  ["Réseaux, sécurité et cloud", /r[ée]seau|cloud|pare-feu/i],
  ["Certifications professionnelles", /certification|\bdscg\b|\bacca\b|\bcpa\b|\bccna\b|\bitil\b|\bitb\b/i],
];

function anglais(o) {
  const texte = [o.langue, o.competences, o.diplome, o.experience, o.formation, o.description].filter(Boolean).join("\n");
  if (!/anglais|bilingue|english/i.test(texte)) return "Non mentionné";
  if (/anglais[^.\n]{0,45}(atout|souhait|appr[ée]ci)|(atout|souhait)[^.\n]{0,30}anglais/i.test(texte)) return "Un atout";
  return "Exigé";
}

const jours = (debut, fin) => {
  if (!debut || !fin) return null;
  const n = Math.round((Date.parse(fin) - Date.parse(debut)) / 86400000);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const moyenne = (liste) => (liste.length ? liste.reduce((s, v) => s + v, 0) / liste.length : null);
const arrondi = (v, d = 1) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
const pourcent = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function compter(liste, champ, ordre = null) {
  const m = new Map();
  for (const x of liste) m.set(x[champ], (m.get(x[champ]) || 0) + 1);
  const lignes = [...m.entries()].map(([k, total]) => ({ [champ]: k, total }));
  return ordre
    ? lignes.sort((a, b) => ordre.indexOf(a[champ]) - ordre.indexOf(b[champ]))
    : lignes.sort((a, b) => b.total - a.total || String(a[champ]).localeCompare(String(b[champ]), "fr"));
}

const dateFr = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
const pluriel = (n, mot) => `${n} ${mot}${n > 1 && !/[sxz]$/.test(mot) ? "s" : ""}`;
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export async function getAnalysePremium(req, res) {
  const toutes = String(req.query.year || "") === "toutes";
  const { annee } = lirePeriode(req.query);

  try {
    const params = [];
    const filtre = toutes ? "" : `AND ${conditionPeriode("o.date_publication", { annee, mois: null }, params)}`;
    const [{ rows }, annees] = await Promise.all([
      pool.query(
        `SELECT o.id, o.titre, o.employeur, o.lieu, o.type_contrat, o.statut,
                TO_CHAR(o.date_publication, 'YYYY-MM-DD') AS date_publication,
                TO_CHAR(o.date_limite, 'YYYY-MM-DD') AS date_limite,
                o.resume, o.description, o.attributions, o.competences, o.diplome, o.formation,
                o.experience, o.certifications, o.logiciels, o.langue,
                (o.date_limite IS NOT NULL AND o.date_limite < CURRENT_DATE) AS expiree,
                (SELECT COUNT(*)::int FROM candidatures c WHERE c.offre_id = o.id) AS candidatures
           FROM offres o
          WHERE ${OFFRE_PARUE} AND o.date_publication IS NOT NULL ${filtre}
       ORDER BY o.date_publication, o.id`,
        params
      ),
      // Années proposées : celles où au moins un avis est paru
      pool
        .query(
          `SELECT DISTINCT EXTRACT(YEAR FROM o.date_publication)::int AS a
             FROM offres o
            WHERE ${OFFRE_PARUE} AND o.date_publication IS NOT NULL
         ORDER BY 1 DESC`
        )
        .then((r) => r.rows.map((l) => l.a)),
    ]);

    // Employeurs : mêmes regroupements d'orthographe que dans le tableau de bord
    const employeurs = regrouper(rows.map((o) => ({ employeur: o.employeur, total: 1 })), "employeur");
    const nomEmployeur = new Map(employeurs.map((e) => [cle(e.employeur), e.employeur]));

    const avis = rows.map((o) => {
      const texte = [o.resume, o.description, o.attributions, o.competences, o.diplome, o.formation, o.experience, o.certifications, o.logiciels, o.langue]
        .filter(Boolean)
        .join("\n");
      const niveau = niveauEtudes(o);
      const experience = anneesExperience(o);
      return {
        id: o.id,
        titre: o.titre,
        employeur: nomEmployeur.get(cle(o.employeur)) || "Non précisé",
        date_publication: o.date_publication,
        date_limite: o.date_limite,
        mois: o.date_publication.slice(0, 7),
        duree_jours: jours(o.date_publication, o.date_limite),
        etat: LOWER_STATUT(o.statut) === "suspendue" ? "Suspendue" : o.expiree || /^cl[oô]tur[ée]e$/.test(LOWER_STATUT(o.statut)) ? "Expirée" : "Ouverte",
        famille: familleDe(o.titre),
        responsabilite: responsabiliteDe(o.titre),
        niveau_etudes: niveau ? `Bac+${niveau}` : "Non précisé",
        experience_ans: experience,
        tranche_experience: trancheExperience(experience),
        anglais: anglais(o),
        competences: COMPETENCES.filter(([, re]) => re.test(texte)).map(([nom]) => nom),
        candidatures: o.candidatures,
      };
    });

    const n = avis.length;
    const durees = avis.map((a) => a.duree_jours).filter((v) => v != null);
    const experiences = avis.map((a) => a.experience_ans).filter((v) => v != null);
    const encadrement = avis.filter((a) => a.responsabilite === "Encadrement").length;
    const totalCandidatures = avis.reduce((s, a) => s + a.candidatures, 0);

    // Publications par mois, ventilées par employeur (les 4 premiers, puis « Autres »)
    const tetes = employeurs.slice(0, 4).map((e) => e.employeur);
    const series = employeurs.length > 4 ? [...tetes, "Autres"] : tetes;
    const moisPresents = [...new Set(avis.map((a) => a.mois))].sort();
    const axeMois = toutes || !moisPresents.length ? moisPresents : MOIS.map((m) => `${annee}-${m}`);
    const parMois = axeMois.map((m) => {
      const ligne = { mois: m, total: 0 };
      for (const s of series) ligne[s] = 0;
      for (const a of avis.filter((x) => x.mois === m)) {
        ligne[tetes.includes(a.employeur) ? a.employeur : "Autres"] += 1;
        ligne.total += 1;
      }
      return ligne;
    });

    const parEmployeur = employeurs.map((e) => {
      const siens = avis.filter((a) => a.employeur === e.employeur);
      const d = siens.map((a) => a.duree_jours).filter((v) => v != null);
      const x = siens.map((a) => a.experience_ans).filter((v) => v != null);
      return {
        employeur: e.employeur,
        avis: siens.length,
        part: pourcent(siens.length, n),
        duree_moyenne_jours: arrondi(moyenne(d)),
        experience_moyenne_ans: arrondi(moyenne(x)),
        encadrement: siens.filter((a) => a.responsabilite === "Encadrement").length,
        candidatures: siens.reduce((s, a) => s + a.candidatures, 0),
      };
    });

    // Campagnes : avis d'un même employeur parus le même jour
    const campagnes = [];
    for (const a of avis) {
      let c = campagnes.find((x) => x.employeur === a.employeur && x.debut === a.date_publication);
      if (!c) campagnes.push((c = { employeur: a.employeur, debut: a.date_publication, fin: a.date_limite, avis: 0 }));
      c.avis += 1;
      if (a.date_limite && (!c.fin || a.date_limite > c.fin)) c.fin = a.date_limite;
    }
    campagnes.forEach((c) => (c.duree_jours = jours(c.debut, c.fin)));

    const competences = COMPETENCES.map(([nom]) => {
      const total = avis.filter((a) => a.competences.includes(nom)).length;
      return { competence: nom, total, part: pourcent(total, n) };
    })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total || a.competence.localeCompare(b.competence, "fr"))
      .slice(0, 12);

    const familles = compter(avis, "famille");
    const niveaux = compter(avis, "niveau_etudes", ["Bac+2", "Bac+3", "Bac+4", "Bac+5", "Bac+6", "Bac+7", "Bac+8", "Non précisé"]);
    const tranches = compter(avis, "tranche_experience", ORDRE_TRANCHES);

    // Lecture rapide : phrases calculées à partir des chiffres ci-dessus
    const lecture = [];
    if (n) {
      const premier = parEmployeur[0];
      lecture.push(
        `${pluriel(n, "avis")} ${n > 1 ? "sont parus" : "est paru"} ${toutes ? "au total" : `en ${annee}`} pour ${pluriel(employeurs.length, "employeur")}` +
          (employeurs.length > 1 ? ` ; ${premier.employeur} en représente ${premier.part} %.` : ".")
      );
      if (durees.length) {
        const min = Math.min(...durees);
        const max = Math.max(...durees);
        lecture.push(
          `Les candidats ont disposé en moyenne de ${String(arrondi(moyenne(durees), 0))} jours pour postuler` +
            (min !== max ? ` (de ${min} à ${max} jours selon les avis).` : ".")
        );
      }
      lecture.push(
        `${pourcent(encadrement, n)} % des avis portent sur des postes d'encadrement` +
          (experiences.length
            ? ` ; l'expérience demandée est de ${String(arrondi(moyenne(experiences))).replace(".", ",")} ans en moyenne (précisée dans ${experiences.length} avis sur ${n}).`
            : ".")
      );
      if (familles.length) lecture.push(`Famille de métiers la plus recherchée : ${familles[0].famille} (${pluriel(familles[0].total, "avis")}).`);
      if (competences.length) lecture.push(`Compétences les plus citées : ${competences.slice(0, 3).map((c) => c.competence).join(", ")}.`);
      const pic = [...parMois].sort((a, b) => b.total - a.total)[0];
      if (pic?.total) lecture.push(`Mois le plus actif : ${MOIS_FR[Number(pic.mois.slice(5, 7)) - 1]} ${pic.mois.slice(0, 4)}, avec ${pluriel(pic.total, "avis")}.`);
      lecture.push(
        totalCandidatures
          ? `${pluriel(totalCandidatures, "candidature")} ${totalCandidatures > 1 ? "ont été déposées" : "a été déposée"} sur le site pour ces avis, soit ${String(arrondi(totalCandidatures / n)).replace(".", ",")} par avis.`
          : "Aucune candidature n'a été déposée sur le site pour ces avis."
      );
    }

    res.json({
      annees,
      annee: toutes ? "toutes" : annee,
      indicateurs: {
        avis: n,
        employeurs: employeurs.length,
        avis_ouverts: avis.filter((a) => a.etat === "Ouverte").length,
        duree_moyenne_jours: arrondi(moyenne(durees), 0),
        experience_moyenne_ans: arrondi(moyenne(experiences)),
        part_encadrement: pourcent(encadrement, n),
        candidatures: totalCandidatures,
        candidatures_par_avis: n ? arrondi(totalCandidatures / n) : null,
      },
      lecture,
      series_employeurs: series,
      par_mois: parMois,
      par_employeur: parEmployeur,
      campagnes: campagnes
        .sort((a, b) => a.debut.localeCompare(b.debut) || a.employeur.localeCompare(b.employeur, "fr"))
        .map((c) => ({ ...c, debut_fr: dateFr(c.debut), fin_fr: dateFr(c.fin) })),
      familles,
      niveaux_etudes: niveaux,
      experience: tranches,
      responsabilite: compter(avis, "responsabilite"),
      anglais: compter(avis, "anglais", ["Exigé", "Un atout", "Non mentionné"]),
      competences,
      avis: avis.map(({ competences: c, mois, ...reste }) => ({ ...reste, competences: c.length })),
    });
  } catch (err) {
    console.error("❌ [ADMIN/STATS/premium] Error:", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "STATS_PREMIUM_FAILED", details: err.message });
  }
}

function LOWER_STATUT(s) {
  return String(s || "").toLowerCase();
}
