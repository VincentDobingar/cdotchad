// 📁 src/pages/admin/DashboardHome.jsx
// Tableau de bord de l'administration.
// Deux volets : les offres parues (comptées à leur date de publication) et les candidatures
// reçues (comptées à leur date de dépôt). Chaque graphique peut s'afficher en tableau.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import toast from "react-hot-toast";
import StatCard from "@/components/admin/StatCard";
import ExportButtons from "@/components/admin/ExportButtons";
import usePdfExport from "@/hooks/usePdfExport";
import useCsvExport from "@/hooks/useCsvExport";
import { Loader2, Briefcase, FileText, UserPlus, Newspaper, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { statutLabel } from "@/utils/statutCandidature";
import {
  Carte,
  Vide,
  BarresVerticales,
  BarresHorizontales,
  ROUGE,
  REFERENCE,
  MOIS_COURTS,
  MOIS_LONGS,
} from "@/components/admin/Graphiques";

/* Helpers robustes de rôle (insensible à la casse + flags + codes) */
const roleOf = (a) => String(a?.role ?? a?.user_role ?? a?.type ?? "").toLowerCase();
const isSuperAdmin = (a) =>
  a?.isSuperAdmin === true || a?.superAdmin === true || a?.super_admin === true ||
  roleOf(a) === "superadmin" || a?.role === 99;
const isAdmin = (a) => a?.isAdmin === true || isSuperAdmin(a) || roleOf(a) === "admin";

const liste = (v) => (Array.isArray(v) ? v : []);
const moisCourt = (m) => MOIS_COURTS[Number(m) - 1] || m;
const moisLong = (m) => MOIS_LONGS[Number(m) - 1] || m;
const dateFr = (iso) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const ORDRE_STATUTS = ["recue", "en_cours", "entretien", "acceptee", "refusee"];

export default function DashboardHome() {
  const navigate = useNavigate();
  const { status, user: admin } = useAuth();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(""); // "01".."12" ou ""
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ❶ Si l’utilisateur n’est pas admin → on le sort proprement
  useEffect(() => {
    if (status === "authenticated" && !isAdmin(admin)) {
      toast.error("Accès réservé à l’équipe (admin).");
      navigate("/admin/login", { replace: true });
    }
  }, [status, admin, navigate]);

  // debounce pour éviter de spammer l’API
  const debounceTimer = useRef(null);
  const deps = useMemo(() => ({ year, month }), [year, month]);

  // ❷ Fetch unique (resume) avec gestion 401/403 propre
  useEffect(() => {
    if (status !== "authenticated" || !isAdmin(admin)) return;

    const ac = new AbortController();
    const run = () => {
      setLoading(true);
      api
        .get("/admin/stats/resume", {
          params: { year, month: month || undefined },
          signal: ac.signal,
        })
        .then(({ data }) => {
          // Parfois un mauvais .htaccess renvoie du HTML : on le détecte
          if (typeof data === "string" && /<!doctype html>/i.test(data)) {
            throw new Error("Réponse HTML inattendue (vérifie .htaccess côté API).");
          }
          setData(data);
        })
        .catch((e) => {
          if (ac.signal.aborted) return;
          const status = e?.response?.status;
          const msg = e?.response?.data?.message || e?.message || "Erreur";

          if (status === 429) toast.error("Trop de requêtes. Réessaie dans un instant.");
          else toast.error(`Stats: ${status ?? ""} ${msg}`);

          // Session expirée / interdite → retour login
          if (status === 401 || status === 403) {
            localStorage.removeItem("adminToken");
            sessionStorage.removeItem("adminToken");
            navigate("/admin/login", { replace: true });
          }
          setData(null);
        })
        .finally(() => !ac.signal.aborted && setLoading(false));
    };

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(run, 300);

    return () => {
      clearTimeout(debounceTimer.current);
      ac.abort();
    };
  }, [deps, status, admin, navigate]);

  // ---------- Données ----------
  const d = data || {};
  const p = d.periode || {};
  const offresParMois = liste(d.offres_par_mois);
  const offresParEmployeur = liste(d.offres_par_employeur);
  const offresParContrat = liste(d.offres_par_type_contrat);
  const offresParLieu = liste(d.offres_par_lieu);
  const offresParEtat = liste(d.offres_par_etat);
  const candsParOffre = liste(d.candidatures_par_offre);
  const candsParStatut = [...liste(d.candidatures_par_statut)]
    .sort((a, b) => ORDRE_STATUTS.indexOf(a.statut) - ORDRE_STATUTS.indexOf(b.statut))
    .map((x) => ({ ...x, libelle: statutLabel(x.statut) }));
  const candsParContrat = liste(d.par_type_contrat);
  const candsParLieu = liste(d.par_lieu);
  const actualites = liste(d.actualites_par_categorie);
  const actualitesScope = typeof d.actualites_scope === "string" ? d.actualites_scope : "year";

  // Candidatures : année choisie et année précédente, mois par mois
  const anneePrecedente = d.annee_precedente ?? Number(year) - 1;
  const comparaison = liste(d.multi_year_data);
  const candsParMois = liste(d.candidatures_par_mois).map((x) => ({
    mois: x.mois,
    total: x.total,
    precedent: comparaison.find((t) => t.annee === String(anneePrecedente) && t.mois === x.mois)?.total || 0,
  }));
  const precedentNonVide = candsParMois.some((x) => x.precedent > 0);

  // Années proposées : celles où il existe des offres ou des candidatures
  const annees = useMemo(() => {
    const s = new Set([...liste(d.annees), new Date().getFullYear(), Number(year)]);
    return [...s].sort((a, b) => b - a);
  }, [d.annees, year]);
  const autresAnnees = liste(d.annees).filter((a) => a !== Number(year));

  const periode = month ? `${moisLong(month)} ${year}` : String(year);
  const offresPeriode = p.offres ?? 0;
  const candsPeriode = p.candidatures ?? 0;

  // ---------- Exports ----------
  const exportRef = useRef(null);
  const { exportPDF } = usePdfExport(exportRef, {
    title: "CDOTCHAD - Tableau de bord",
    header: `Période : ${periode}`,
    filePrefix: `tableau-de-bord-${year}${month ? `-${month}` : ""}`,
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
    rows.push([`Tableau de bord — ${periode}`]);
    rows.push([]);
    bloc("Chiffres clés", ["Indicateur", "Valeur"], [
      [`Offres parues (${periode})`, offresPeriode],
      [`Employeurs ayant publié (${periode})`, p.employeurs ?? 0],
      [`Candidatures reçues (${periode})`, candsPeriode],
      ["Offres parues, toutes périodes", d.total_offres_parues ?? 0],
      ["Brouillons", d.total_brouillons ?? 0],
      ["Candidatures, toutes périodes", d.total_candidatures ?? 0],
      ["Utilisateurs inscrits", d.total_utilisateurs ?? 0],
      ["Actualités", d.total_actualites ?? 0],
    ]);
    bloc(`Offres parues par mois (${year})`, ["Mois", "Offres"], offresParMois.map((x) => [moisLong(x.mois), x.total]));
    bloc(`Offres par employeur (${periode})`, ["Employeur", "Offres"], offresParEmployeur.map((x) => [x.employeur, x.total]));
    bloc(`Offres par type de contrat (${periode})`, ["Type de contrat", "Offres"], offresParContrat.map((x) => [x.type_contrat, x.total]));
    bloc(`Offres par lieu (${periode})`, ["Lieu", "Offres"], offresParLieu.map((x) => [x.lieu, x.total]));
    bloc(`État des offres (${periode})`, ["État", "Offres"], offresParEtat.map((x) => [x.etat, x.total]));
    bloc("Candidatures par mois", ["Mois", String(year), String(anneePrecedente)], candsParMois.map((x) => [moisLong(x.mois), x.total, x.precedent]));
    bloc(`Candidatures par offre (${periode})`, ["Offre", "Candidatures"], candsParOffre.map((x) => [x.titre, x.total]));
    bloc(`Candidatures par statut (${periode})`, ["Statut", "Candidatures"], candsParStatut.map((x) => [x.libelle, x.total]));
    bloc(`Candidatures par type de contrat (${periode})`, ["Type de contrat", "Candidatures"], candsParContrat.map((x) => [x.type_contrat, x.total]));
    bloc(`Candidatures par lieu (${periode})`, ["Lieu", "Candidatures"], candsParLieu.map((x) => [x.lieu, x.total]));
    bloc(
      `Actualités par catégorie (${actualitesScope === "all" ? "toutes années" : year})`,
      ["Catégorie", "Actualités"],
      actualites.map((x) => [x.categorie, x.total])
    );
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, year, month]);

  // ---------- État d’auth / chargement ----------
  if (status === "checking") {
    return (
      <div className="w-full py-10 flex items-center justify-center text-gray-500">
        Vérification de la session…
      </div>
    );
  }
  if (status !== "authenticated" || !isAdmin(admin)) {
    return null; // on a déjà redirigé plus haut
  }

  const selectClass =
    "border border-slate-300 bg-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600";

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Vue d'ensemble de l'activité — {month ? periode : `${year} · toute l'année`}
          </p>
        </div>
        <ExportButtons
          onPdf={() => exportPDF()}
          onCsv={() => exportCSV(csvRows, `tableau-de-bord-${year}${month ? `-${month}` : ""}`, { excel: true })}
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <label htmlFor="filtre-annee" className="text-sm font-medium text-slate-600">Année</label>
        <select id="filtre-annee" value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
          {annees.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <label htmlFor="filtre-mois" className="text-sm font-medium text-slate-600">Mois</label>
        <select id="filtre-mois" value={month} onChange={(e) => setMonth(e.target.value)} className={selectClass}>
          <option value="">Tous</option>
          {MOIS_LONGS.map((nom, i) => {
            const m = String(i + 1).padStart(2, "0");
            return <option key={m} value={m}>{nom.charAt(0).toUpperCase() + nom.slice(1)}</option>;
          })}
        </select>

        {loading && data && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mise à jour…
          </span>
        )}
      </div>

      {loading && !data ? (
        <div className="flex justify-center items-center py-16 text-slate-500">
          <Loader2 className="animate-spin h-6 w-6" />
          <span className="ml-2">Chargement des statistiques…</span>
        </div>
      ) : (
        <div ref={exportRef} className="space-y-8">
          {/* Chiffres clés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" id="dashboard">
            <StatCard
              title="Offres parues"
              tone="rouge"
              icon={<Briefcase className="w-5 h-5" />}
              value={offresPeriode}
              hint={`en ${periode} · ${d.total_offres_parues ?? 0} toutes années · ${pluriel(d.total_brouillons ?? 0, "brouillon")}`}
            />
            <StatCard
              title="Candidatures reçues"
              tone="bleu"
              icon={<FileText className="w-5 h-5" />}
              value={candsPeriode}
              hint={
                d.derniere_candidature
                  ? `en ${periode} · ${d.total_candidatures ?? 0} toutes années · dernière le ${dateFr(d.derniere_candidature)}`
                  : `en ${periode} · ${d.total_candidatures ?? 0} toutes années`
              }
            />
            <StatCard
              title="Utilisateurs"
              tone="vert"
              icon={<UserPlus className="w-5 h-5" />}
              value={d.total_utilisateurs ?? 0}
              hint="comptes candidats et partenaires"
            />
            <StatCard
              title="Actualités"
              tone="jaune"
              icon={<Newspaper className="w-5 h-5" />}
              value={d.total_actualites ?? 0}
              hint="articles en ligne"
            />
          </div>

          {/* ------------------------------------------------ Offres */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Offres d'emploi</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {offresPeriode > 0
                  ? `${pluriel(offresPeriode, "offre")} ${offresPeriode > 1 ? "parues" : "parue"} en ${periode}, publiée${offresPeriode > 1 ? "s" : ""} par ${pluriel(p.employeurs ?? 0, "employeur")}. Les brouillons ne sont pas comptés.`
                  : "Offres comptées à leur date de publication. Les brouillons ne sont pas comptés."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Carte
                titre={`Offres parues par mois — ${year}`}
                sousTitre={month ? `Mois sélectionné : ${moisLong(month)}` : undefined}
                tableau={{ colonnes: ["Mois", "Offres"], lignes: offresParMois.map((x) => [moisLong(x.mois), x.total]) }}
              >
                {offresParMois.some((x) => x.total > 0) ? (
                  <BarresVerticales
                    donnees={offresParMois}
                    cleLibelle="mois"
                    series={[{ cle: "total", nom: "Offres parues", couleur: ROUGE }]}
                    surligne={month || null}
                    formatLibelle={moisCourt}
                    titreBulle={(m) => `${moisLong(m)} ${year}`}
                  />
                ) : (
                  <Vide>Aucune offre parue en {year}.</Vide>
                )}
              </Carte>

              <Carte
                titre="Offres par employeur"
                sousTitre={periode}
                tableau={{ colonnes: ["Employeur", "Offres"], lignes: offresParEmployeur.map((x) => [x.employeur, x.total]) }}
              >
                {offresParEmployeur.length > 0 ? (
                  <BarresHorizontales donnees={offresParEmployeur} cleLibelle="employeur" nom="Offres parues" />
                ) : (
                  <Vide>Aucune offre parue en {periode}.</Vide>
                )}
              </Carte>
            </div>

            {offresPeriode > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Carte
                  titre="Type de contrat"
                  sousTitre={periode}
                  tableau={{ colonnes: ["Type de contrat", "Offres"], lignes: offresParContrat.map((x) => [x.type_contrat, x.total]) }}
                >
                  <BarresHorizontales donnees={offresParContrat} cleLibelle="type_contrat" nom="Offres" />
                </Carte>
                <Carte
                  titre="Lieux de travail"
                  sousTitre={`Les plus fréquents · ${periode}`}
                  tableau={{ colonnes: ["Lieu", "Offres"], lignes: offresParLieu.map((x) => [x.lieu, x.total]) }}
                >
                  <BarresHorizontales donnees={offresParLieu} cleLibelle="lieu" nom="Offres" />
                </Carte>
                <Carte
                  titre="État des offres"
                  sousTitre="Aujourd'hui, selon la date limite"
                  tableau={{ colonnes: ["État", "Offres"], lignes: offresParEtat.map((x) => [x.etat, x.total]) }}
                >
                  <BarresHorizontales donnees={offresParEtat} cleLibelle="etat" nom="Offres" />
                </Carte>
              </div>
            )}
          </section>

          {/* ------------------------------------------------ Candidatures */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Candidatures</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Candidatures déposées sur le site, comptées à leur date de dépôt.</p>
            </div>

            {candsPeriode === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <p className="font-semibold">Aucune candidature reçue en {periode}.</p>
                <p className="mt-1">
                  {(d.total_candidatures ?? 0) > 0
                    ? `Le site compte ${pluriel(d.total_candidatures, "candidature")} au total${d.derniere_candidature ? `, la dernière déposée le ${dateFr(d.derniere_candidature)}` : ""}.`
                    : "Aucune candidature n'a encore été déposée sur le site."}
                </p>
                {autresAnnees.length > 0 && (d.total_candidatures ?? 0) > 0 && (
                  <p className="mt-3 flex flex-wrap items-center gap-2" data-html2canvas-ignore="true">
                    <span>Voir une autre année :</span>
                    {autresAnnees.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setMonth("");
                          setYear(a);
                        }}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-1 font-medium text-amber-900 hover:bg-amber-100"
                      >
                        {a}
                      </button>
                    ))}
                  </p>
                )}
              </div>
            )}

            {(candsPeriode > 0 || candsParMois.some((x) => x.total > 0 || x.precedent > 0)) && (
              <Carte
                titre={`Candidatures par mois — ${year}`}
                sousTitre={precedentNonVide ? `Comparées à ${anneePrecedente}` : undefined}
                tableau={{
                  colonnes: precedentNonVide ? ["Mois", String(year), String(anneePrecedente)] : ["Mois", "Candidatures"],
                  lignes: candsParMois.map((x) => (precedentNonVide ? [moisLong(x.mois), x.total, x.precedent] : [moisLong(x.mois), x.total])),
                }}
              >
                <BarresVerticales
                  donnees={candsParMois}
                  cleLibelle="mois"
                  series={
                    precedentNonVide
                      ? [
                          { cle: "total", nom: String(year), couleur: ROUGE },
                          { cle: "precedent", nom: String(anneePrecedente), couleur: REFERENCE },
                        ]
                      : [{ cle: "total", nom: "Candidatures", couleur: ROUGE }]
                  }
                  surligne={!precedentNonVide && month ? month : null}
                  formatLibelle={moisCourt}
                  titreBulle={(m) => moisLong(m)}
                />
              </Carte>
            )}

            {candsPeriode > 0 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Carte
                    titre="Offres les plus demandées"
                    sousTitre={`Candidatures reçues par offre · ${periode}`}
                    tableau={{ colonnes: ["Offre", "Candidatures"], lignes: candsParOffre.map((x) => [x.titre, x.total]) }}
                  >
                    <BarresHorizontales donnees={candsParOffre} cleLibelle="titre" nom="Candidatures" />
                  </Carte>
                  <Carte
                    titre="Avancement des candidatures"
                    sousTitre={`Par statut · ${periode}`}
                    tableau={{ colonnes: ["Statut", "Candidatures"], lignes: candsParStatut.map((x) => [x.libelle, x.total]) }}
                  >
                    <BarresHorizontales donnees={candsParStatut} cleLibelle="libelle" nom="Candidatures" />
                  </Carte>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Carte
                    titre="Candidatures par type de contrat"
                    sousTitre={periode}
                    tableau={{ colonnes: ["Type de contrat", "Candidatures"], lignes: candsParContrat.map((x) => [x.type_contrat, x.total]) }}
                  >
                    <BarresHorizontales donnees={candsParContrat} cleLibelle="type_contrat" nom="Candidatures" />
                  </Carte>
                  <Carte
                    titre="Candidatures par lieu de travail"
                    sousTitre={`Les plus demandés · ${periode}`}
                    tableau={{ colonnes: ["Lieu", "Candidatures"], lignes: candsParLieu.map((x) => [x.lieu, x.total]) }}
                  >
                    <BarresHorizontales donnees={candsParLieu} cleLibelle="lieu" nom="Candidatures" />
                  </Carte>
                </div>
              </>
            )}
          </section>

          {/* ------------------------------------------------ Actualités */}
          {actualites.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Actualités</h2>
              <Carte
                titre="Actualités par catégorie"
                sousTitre={
                  actualitesScope === "all"
                    ? `Aucune actualité publiée en ${year} : toutes années confondues`
                    : `Publiées en ${year}`
                }
                tableau={{ colonnes: ["Catégorie", "Actualités"], lignes: actualites.map((x) => [x.categorie, x.total]) }}
              >
                <BarresHorizontales donnees={actualites} cleLibelle="categorie" nom="Actualités" />
              </Carte>
            </section>
          )}

          {/* Passerelle vers l'analyse détaillée */}
          <Link
            to="/admin/analyse"
            data-html2canvas-ignore="true"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-white shadow-sm hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Analyse premium des avis de recrutement</span>
              <span className="block text-sm text-slate-300">
                Métiers recherchés, niveau d'études, expérience, compétences, campagnes par employeur.
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}
