// 📁 src/pages/admin/AnalysePremium.jsx
// Analyse premium : ce que disent les avis de recrutement publiés sur le site
// (métiers recherchés, profils demandés, compétences, campagnes par employeur).
// Les chiffres sont calculés par le serveur à partir du texte des avis : /admin/stats/premium.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import toast from "react-hot-toast";
import ExportButtons from "@/components/admin/ExportButtons";
import usePdfExport from "@/hooks/usePdfExport";
import useCsvExport from "@/hooks/useCsvExport";
import { Loader2, Sparkles, Lightbulb, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  Carte,
  Tableau,
  Vide,
  BarresVerticales,
  BarresHorizontales,
  BarresEmpilees,
  ROUGE,
  SERIES,
  MOIS_COURTS,
  MOIS_LONGS,
} from "@/components/admin/Graphiques";

const roleOf = (a) => String(a?.role ?? a?.user_role ?? a?.type ?? "").toLowerCase();
const isAdmin = (a) =>
  a?.isAdmin === true ||
  a?.isSuperAdmin === true ||
  a?.superAdmin === true ||
  a?.super_admin === true ||
  ["admin", "superadmin"].includes(roleOf(a)) ||
  a?.role === 99;

const liste = (v) => (Array.isArray(v) ? v : []);
const dateFr = (iso) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const fr = (v, unite = "") => (v == null ? "—" : `${Number(v).toLocaleString("fr-FR")}${unite}`);
const AUTRES = "#94a3b8";

function Indicateur({ titre, valeur, precision }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{titre}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{valeur}</p>
      {precision && <p className="mt-0.5 text-xs text-slate-500">{precision}</p>}
    </div>
  );
}

export default function AnalysePremium() {
  const navigate = useNavigate();
  const { status, user: admin } = useAuth();

  const [annee, setAnnee] = useState(String(new Date().getFullYear()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && !isAdmin(admin)) {
      toast.error("Accès réservé à l’équipe (admin).");
      navigate("/admin/login", { replace: true });
    }
  }, [status, admin, navigate]);

  useEffect(() => {
    if (status !== "authenticated" || !isAdmin(admin)) return;
    const ac = new AbortController();
    setLoading(true);
    api
      .get("/admin/stats/premium", { params: { year: annee }, signal: ac.signal })
      .then(({ data }) => {
        if (typeof data === "string") throw new Error("Réponse inattendue du serveur.");
        setData(data);
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        const code = e?.response?.status;
        toast.error(`Analyse : ${code ?? ""} ${e?.response?.data?.message || e?.message || "Erreur"}`);
        if (code === 401 || code === 403) {
          localStorage.removeItem("adminToken");
          sessionStorage.removeItem("adminToken");
          navigate("/admin/login", { replace: true });
        }
        setData(null);
      })
      .finally(() => !ac.signal.aborted && setLoading(false));
    return () => ac.abort();
  }, [annee, status, admin, navigate]);

  const d = data || {};
  const k = d.indicateurs || {};
  const toutes = annee === "toutes";
  const periode = toutes ? "toutes années" : annee;
  const annees = useMemo(() => {
    const s = new Set([...liste(d.annees).map(String), String(new Date().getFullYear())]);
    if (!toutes) s.add(annee);
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [d.annees, annee, toutes]);

  // Séries « employeur » : couleur attachée au nom, dans l'ordre fixe de la palette
  const employeurs = liste(d.series_employeurs);
  // (clés neutres s0, s1… : un nom d'employeur peut contenir des points)
  const seriesEmployeurs = employeurs.map((nom, i) => ({
    cle: `s${i}`,
    nom,
    couleur: nom === "Autres" ? AUTRES : SERIES[i % SERIES.length],
  }));
  const parMois = liste(d.par_mois);
  const parMoisGraphique = parMois.map((m) => ({
    mois: m.mois,
    total: m.total,
    ...Object.fromEntries(employeurs.map((e, i) => [`s${i}`, m[e] ?? 0])),
  }));
  const libelleMois = (m) => {
    const [a, mm] = String(m).split("-");
    return toutes ? `${MOIS_COURTS[Number(mm) - 1]} ${a.slice(2)}` : MOIS_COURTS[Number(mm) - 1];
  };
  const moisComplet = (m) => {
    const [a, mm] = String(m).split("-");
    return `${MOIS_LONGS[Number(mm) - 1]} ${a}`;
  };

  const parEmployeur = liste(d.par_employeur);
  const familles = liste(d.familles);
  const competences = liste(d.competences);
  const niveaux = liste(d.niveaux_etudes);
  const experience = liste(d.experience);
  const responsabilite = liste(d.responsabilite);
  const anglais = liste(d.anglais);
  const campagnes = liste(d.campagnes);
  const avis = liste(d.avis);
  const n = k.avis ?? 0;

  // ---------- Exports ----------
  const exportRef = useRef(null);
  const { exportPDF } = usePdfExport(exportRef, {
    title: "CDOTCHAD - Analyse premium des avis de recrutement",
    header: `Période : ${periode}`,
    filePrefix: `analyse-premium-${annee}`,
  });
  const { exportCSV } = useCsvExport();

  const csvRows = useMemo(() => {
    const rows = [];
    const bloc = (titre, entete, lignes) => {
      rows.push([titre]);
      rows.push(entete);
      lignes.forEach((l) => rows.push(l));
      rows.push([]);
    };
    rows.push([`Analyse premium des avis de recrutement — ${periode}`]);
    rows.push([]);
    bloc(
      "Indicateurs",
      ["Indicateur", "Valeur"],
      [
        ["Avis parus", n],
        ["Employeurs", k.employeurs ?? 0],
        ["Avis encore ouverts", k.avis_ouverts ?? 0],
        ["Délai moyen pour postuler (jours)", k.duree_moyenne_jours ?? ""],
        ["Expérience demandée, moyenne (années)", k.experience_moyenne_ans ?? ""],
        ["Part des postes d'encadrement (%)", k.part_encadrement ?? ""],
        ["Candidatures reçues sur le site", k.candidatures ?? 0],
      ],
    );
    bloc(
      "Lecture rapide",
      ["Constat"],
      liste(d.lecture).map((l) => [l]),
    );
    bloc(
      "Avis parus par mois",
      ["Mois", ...employeurs, "Total"],
      parMois.map((m) => [moisComplet(m.mois), ...employeurs.map((e) => m[e] ?? 0), m.total]),
    );
    bloc(
      "Employeurs",
      ["Employeur", "Avis", "Part (%)", "Délai moyen pour postuler (j)", "Expérience moyenne (ans)", "Postes d'encadrement", "Candidatures"],
      parEmployeur.map((e) => [
        e.employeur,
        e.avis,
        e.part,
        e.duree_moyenne_jours ?? "",
        e.experience_moyenne_ans ?? "",
        e.encadrement,
        e.candidatures,
      ]),
    );
    bloc(
      "Familles de métiers",
      ["Famille", "Avis"],
      familles.map((x) => [x.famille, x.total]),
    );
    bloc(
      "Compétences les plus demandées",
      ["Compétence", "Avis", "Part des avis (%)"],
      competences.map((x) => [x.competence, x.total, x.part]),
    );
    bloc(
      "Niveau d'études demandé",
      ["Niveau", "Avis"],
      niveaux.map((x) => [x.niveau_etudes, x.total]),
    );
    bloc(
      "Expérience demandée",
      ["Tranche", "Avis"],
      experience.map((x) => [x.tranche_experience, x.total]),
    );
    bloc(
      "Niveau de responsabilité",
      ["Niveau", "Avis"],
      responsabilite.map((x) => [x.responsabilite, x.total]),
    );
    bloc(
      "Anglais",
      ["Exigence", "Avis"],
      anglais.map((x) => [x.anglais, x.total]),
    );
    bloc(
      "Campagnes de recrutement",
      ["Employeur", "Parution", "Clôture", "Avis", "Durée (j)"],
      campagnes.map((c) => [c.employeur, dateFr(c.debut), dateFr(c.fin), c.avis, c.duree_jours ?? ""]),
    );
    bloc(
      "Détail des avis",
      [
        "Poste",
        "Employeur",
        "Parution",
        "Clôture",
        "Délai (j)",
        "État",
        "Famille de métiers",
        "Responsabilité",
        "Études",
        "Expérience (ans)",
        "Anglais",
        "Candidatures",
      ],
      avis.map((a) => [
        a.titre,
        a.employeur,
        dateFr(a.date_publication),
        dateFr(a.date_limite),
        a.duree_jours ?? "",
        a.etat,
        a.famille,
        a.responsabilite,
        a.niveau_etudes,
        a.experience_ans ?? "",
        a.anglais,
        a.candidatures,
      ]),
    );
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (status === "checking") {
    return <div className="w-full py-10 flex items-center justify-center text-gray-500">Vérification de la session…</div>;
  }
  if (status !== "authenticated" || !isAdmin(admin)) return null;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Analyse premium</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-white dark:bg-white/15">
              <Sparkles className="h-3 w-3" /> Premium
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ce que disent les avis de recrutement publiés sur le site — {toutes ? "toutes années confondues" : annee}
          </p>
        </div>
        <ExportButtons onPdf={() => exportPDF()} onCsv={() => exportCSV(csvRows, `analyse-premium-${annee}`, { excel: true })} />
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <label htmlFor="analyse-annee" className="text-sm font-medium text-slate-600">
          Année de parution
        </label>
        <select
          id="analyse-annee"
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          className="border border-slate-300 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          <option value="toutes">Toutes les années</option>
          {annees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        {loading && data && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mise à jour…
          </span>
        )}
        <Link to="/admin/dashboard" className="ml-auto text-sm font-medium text-red-700 hover:underline">
          ← Tableau de bord
        </Link>
      </div>

      {loading && !data ? (
        <div className="flex justify-center items-center py-16 text-slate-500">
          <Loader2 className="animate-spin h-6 w-6" />
          <span className="ml-2">Analyse des avis en cours…</span>
        </div>
      ) : n === 0 ? (
        <Vide>Aucun avis de recrutement paru {toutes ? "pour le moment" : `en ${annee}`}. Choisissez une autre année ou « Toutes les années ».</Vide>
      ) : (
        <div ref={exportRef} className="space-y-6">
          {/* Indicateurs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Indicateur titre="Avis parus" valeur={fr(n)} precision={`${k.avis_ouverts ?? 0} encore ouvert${(k.avis_ouverts ?? 0) > 1 ? "s" : ""}`} />
            <Indicateur titre="Employeurs" valeur={fr(k.employeurs)} precision="ayant publié" />
            <Indicateur titre="Délai pour postuler" valeur={fr(k.duree_moyenne_jours, " j")} precision="en moyenne, de la parution à la clôture" />
            <Indicateur titre="Expérience demandée" valeur={fr(k.experience_moyenne_ans, " ans")} precision="en moyenne, quand elle est précisée" />
            <Indicateur titre="Postes d'encadrement" valeur={fr(k.part_encadrement, " %")} precision="chef, responsable, directeur…" />
            <Indicateur titre="Candidatures" valeur={fr(k.candidatures)} precision={`${fr(k.candidatures_par_avis)} par avis`} />
          </div>

          {/* Lecture rapide */}
          {liste(d.lecture).length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Lecture rapide
              </h2>
              <ul className="grid gap-x-8 gap-y-2 text-sm text-slate-700 md:grid-cols-2">
                {d.lecture.map((phrase, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-700" />
                    <span>{phrase}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Rythme et employeurs */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Carte
              className="lg:col-span-3"
              titre="Avis parus par mois"
              sousTitre={`Par employeur · ${periode}`}
              tableau={{
                colonnes: ["Mois", ...employeurs, "Total"],
                lignes: parMois.map((m) => [moisComplet(m.mois), ...employeurs.map((e) => m[e] ?? 0), m.total]),
              }}
            >
              <BarresEmpilees
                donnees={parMoisGraphique}
                cleLibelle="mois"
                series={seriesEmployeurs}
                formatLibelle={libelleMois}
                titreBulle={moisComplet}
              />
            </Carte>

            <Carte className="lg:col-span-2" titre="Employeurs" sousTitre="Volume et exigences moyennes">
              <Tableau
                colonnes={["Employeur", "Avis", "Délai (j)", "Exp. (ans)", "Encadr."]}
                lignes={parEmployeur.map((e) => [e.employeur, e.avis, e.duree_moyenne_jours, e.experience_moyenne_ans, e.encadrement])}
              />
              <p className="mt-3 text-xs text-slate-500">
                Délai : jours laissés pour postuler. Exp. : années d'expérience demandées. Encadr. : nombre de postes d'encadrement.
              </p>
            </Carte>
          </div>

          {/* Métiers et compétences */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Carte
              titre="Familles de métiers recherchées"
              sousTitre={`Nombre d'avis · ${periode}`}
              tableau={{ colonnes: ["Famille de métiers", "Avis"], lignes: familles.map((x) => [x.famille, x.total]) }}
            >
              <BarresHorizontales donnees={familles} cleLibelle="famille" nom="Avis" />
            </Carte>
            <Carte
              titre="Compétences les plus demandées"
              sousTitre="Part des avis qui les citent"
              tableau={{ colonnes: ["Compétence", "Avis", "Part (%)"], lignes: competences.map((x) => [x.competence, x.total, x.part]) }}
            >
              <BarresHorizontales donnees={competences} cleLibelle="competence" cle="part" nom="Part des avis" suffixe=" %" max={100} />
            </Carte>
          </div>

          {/* Profil demandé */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Carte
              titre="Niveau d'études demandé"
              sousTitre="Niveau minimal cité dans l'avis"
              tableau={{ colonnes: ["Niveau", "Avis"], lignes: niveaux.map((x) => [x.niveau_etudes, x.total]) }}
            >
              <BarresVerticales donnees={niveaux} cleLibelle="niveau_etudes" series={[{ cle: "total", nom: "Avis", couleur: ROUGE }]} hauteur={230} />
            </Carte>
            <Carte
              titre="Expérience demandée"
              sousTitre="Nombre d'années minimal cité dans l'avis"
              tableau={{ colonnes: ["Tranche", "Avis"], lignes: experience.map((x) => [x.tranche_experience, x.total]) }}
            >
              <BarresVerticales
                donnees={experience}
                cleLibelle="tranche_experience"
                series={[{ cle: "total", nom: "Avis", couleur: ROUGE }]}
                hauteur={230}
              />
            </Carte>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Carte
              titre="Niveau de responsabilité"
              sousTitre="D'après l'intitulé du poste"
              tableau={{ colonnes: ["Niveau", "Avis"], lignes: responsabilite.map((x) => [x.responsabilite, x.total]) }}
            >
              <BarresHorizontales donnees={responsabilite} cleLibelle="responsabilite" nom="Avis" />
            </Carte>
            <Carte
              titre="Anglais"
              sousTitre="Exigence de langue relevée dans l'avis"
              tableau={{ colonnes: ["Exigence", "Avis"], lignes: anglais.map((x) => [x.anglais, x.total]) }}
            >
              <BarresHorizontales donnees={anglais} cleLibelle="anglais" nom="Avis" />
            </Carte>
          </div>

          {/* Campagnes */}
          <Carte titre="Campagnes de recrutement" sousTitre="Avis d'un même employeur parus le même jour">
            <Tableau
              colonnes={["Employeur", "Parution", "Clôture", "Avis", "Durée (j)"]}
              lignes={campagnes.map((c) => [c.employeur, dateFr(c.debut), dateFr(c.fin), c.avis, c.duree_jours])}
            />
          </Carte>

          {/* Détail */}
          <Carte titre="Détail des avis" sousTitre={`${n} avis · classement automatique à partir du texte`}>
            <Tableau
              dense
              colonnes={["Poste", "Employeur", "Parution", "Délai (j)", "Famille de métiers", "Études", "Exp. (ans)", "État", "Candid."]}
              lignes={avis.map((a) => [
                a.titre,
                a.employeur,
                dateFr(a.date_publication),
                a.duree_jours,
                a.famille,
                a.niveau_etudes,
                a.experience_ans,
                a.etat,
                a.candidatures,
              ])}
            />
          </Carte>

          <p className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Méthode : seuls les avis parus sont analysés (les brouillons sont exclus). La famille de métiers, le niveau d'études, l'expérience,
              l'anglais et les compétences sont repérés automatiquement dans le texte de chaque avis ; un avis rédigé de façon inhabituelle peut être
              classé « Non précisé ». À lire comme une tendance, pas comme un décompte officiel.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
