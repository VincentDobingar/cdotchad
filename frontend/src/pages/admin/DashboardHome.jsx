// 📁 src/pages/admin/DashboardHome.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import toast from "react-hot-toast";
import StatCard from "@/components/admin/StatCard";
import ExportButtons from "@/components/admin/ExportButtons";
import usePdfExport from "@/hooks/usePdfExport";
import useCsvExport from "@/hooks/useCsvExport";
import { Loader2, Briefcase, FileText, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* Helpers robustes de rôle (insensible à la casse + flags + codes) */
const roleOf = (a) => String(a?.role ?? a?.user_role ?? a?.type ?? "").toLowerCase();
const isSuperAdmin = (a) =>
  a?.isSuperAdmin === true || a?.superAdmin === true || a?.super_admin === true ||
  roleOf(a) === "superadmin" || a?.role === 99;
const isAdmin = (a) => a?.isAdmin === true || isSuperAdmin(a) || roleOf(a) === "admin";

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

  // ---------- Exports ----------
  const exportRef = useRef(null);
  const header = `Année : ${year}${month ? ` - Mois : ${month}` : ""}`;
  const { exportPDF } = usePdfExport(exportRef, {
    title: "CDOTCHAD - Rapport de Statistiques",
    header,
    filePrefix: `rapport-stats-${year}${month ? `-${month}` : ""}`,
  });
  const { exportCSV } = useCsvExport();

  // ---------- Garde-fous ----------
  const d = data || {};
  const candidaturesParMois    = Array.isArray(d.candidatures_par_mois) ? d.candidatures_par_mois : [];
  const candidaturesParOffre   = Array.isArray(d.candidatures_par_offre) ? d.candidatures_par_offre : [];
  const parTypeContrat         = Array.isArray(d.par_type_contrat) ? d.par_type_contrat : [];
  const parLieu                = Array.isArray(d.par_lieu) ? d.par_lieu : [];
  const multiYearData          = Array.isArray(d.multi_year_data) ? d.multi_year_data : [];
  const actualitesParCategorie = Array.isArray(d.actualites_par_categorie) ? d.actualites_par_categorie : [];
  const actualitesScope        = typeof d.actualites_scope === "string" ? d.actualites_scope : "year";
  const actualitesYear         = d.actualites_year ?? String(year);

  // ---------- CSV ----------
  const csvRows = useMemo(() => {
    const rows = [];
    rows.push(["Statistiques globales"]);
    rows.push(["Candidatures", d.total_candidatures ?? 0]);
    rows.push(["Utilisateurs", d.total_utilisateurs ?? 0]);
    rows.push(["Offres",       d.total_offres ?? 0]);
    rows.push(["Actualités",   d.total_actualites ?? 0]);
    rows.push([]);

    rows.push(["Candidatures par mois"]); rows.push(["Mois","Total"]);
    candidaturesParMois.forEach((x)=>rows.push([x.mois, x.total])); rows.push([]);

    rows.push(["Candidatures par offre"]); rows.push(["Offre","Total"]);
    candidaturesParOffre.forEach((x)=>rows.push([x.titre, x.total])); rows.push([]);

    rows.push(["Répartition par type de contrat"]); rows.push(["Type","Total"]);
    parTypeContrat.forEach((x)=>rows.push([x.type_contrat, x.total])); rows.push([]);

    rows.push(["Top 5 régions (offres)"]); rows.push(["Lieu","Total"]);
    parLieu.forEach((x)=>rows.push([x.lieu, x.total])); rows.push([]);

    rows.push([`Actualités par catégorie (scope=${actualitesScope}${actualitesScope==="year" ? `, year=${actualitesYear}` : ""})`]);
    rows.push(["Catégorie","Total"]);
    actualitesParCategorie.forEach((x)=>rows.push([x.categorie, x.total])); rows.push([]);

    rows.push(["Évolution mensuelle multi-année"]); rows.push(["Mois", `${year}`, `${Number(year)+1}`]);
    for (let i=1;i<=12;i++){
      const m=String(i).padStart(2,"0");
      const v1=multiYearData.find(t=>t.annee===String(year)&&t.mois===m)?.total||0;
      const v2=multiYearData.find(t=>t.annee===String(Number(year)+1)&&t.mois===m)?.total||0;
      rows.push([m, v1, v2]);
    }
    return rows;
  }, [d, year, month, candidaturesParMois, candidaturesParOffre, parTypeContrat, parLieu, actualitesParCategorie, actualitesScope, actualitesYear, multiYearData]);

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

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground">Année :</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          {[new Date().getFullYear(), 2024, 2023, 2022].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <label className="text-sm text-muted-foreground">Mois :</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Tous</option>
          {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <ExportButtons
          onPdf={() => exportPDF()}
          onCsv={() => exportCSV(csvRows, `stats-resume-${year}${month ? `-${month}` : ""}`)}
        />
      </div>

      {/* Résumé tuiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard">
        {loading ? (
          <div className="col-span-4 flex justify-center items-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
            <span className="ml-2">Chargement des statistiques…</span>
          </div>
        ) : (
          <>
            <StatCard title="Offres"       icon={<Briefcase className="text-blue-500" />}  value={d.total_offres ?? 0} />
            <StatCard title="Candidatures" icon={<FileText  className="text-green-500" />} value={d.total_candidatures ?? 0} />
            <StatCard title="Utilisateurs" icon={<UserPlus  className="text-yellow-500" />} value={d.total_utilisateurs ?? 0} />
            <StatCard title="Actualités"   icon={<FileText  className="text-rose-500" />}   value={d.total_actualites ?? 0} />
          </>
        )}
      </div>

      {/* Contenu exportable */}
      <div ref={exportRef} className="space-y-10">
        {/* Candidatures par mois */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Candidatures par mois — {year}</h2>
          {candidaturesParMois.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RBarChart data={candidaturesParMois}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" />
              </RBarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Aucune donnée disponible.</p>
          )}
        </div>

        {/* Candidatures par offre */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Candidatures par offre</h2>
          {candidaturesParOffre.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border-b">Offre</th>
                  <th className="p-2 border-b">Total</th>
                </tr>
              </thead>
              <tbody>
                {candidaturesParOffre.map((row, i) => (
                  <tr key={`${row.titre}-${i}`} className="border-b hover:bg-gray-50">
                    <td className="p-2">{row.titre}</td>
                    <td className="p-2">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Aucune donnée disponible.</p>
          )}
        </div>

        {/* Répartition par type de contrat */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Répartition par type de contrat</h2>
          {parTypeContrat.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RBarChart data={parTypeContrat}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type_contrat" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" />
              </RBarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Aucune donnée disponible.</p>
          )}
        </div>

        {/* Top 5 régions */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">Top 5 régions avec le plus d’offres</h2>
          {parLieu.length > 0 ? (
            <ul className="text-sm">
              {parLieu.map((item, i) => (
                <li key={`${item.lieu}-${i}`} className="flex justify-between border-b py-1">
                  <span>{item.lieu}</span>
                  <span className="font-semibold">{item.total}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Aucune donnée disponible.</p>
          )}
        </div>

        {/* Évolution multi-années */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">
            Évolution mensuelle ({year} vs {Number(year) + 1})
          </h2>
          {multiYearData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RBarChart
                data={Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  const y2 = String(Number(year) + 1);
                  return {
                    mois: m,
                    [year]: multiYearData.find((d) => d.annee === String(year) && d.mois === m)?.total || 0,
                    [y2]:   multiYearData.find((d) => d.annee === y2 && d.mois === m)?.total || 0,
                  };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey={String(year)} />
                <Bar dataKey={String(Number(year) + 1)} />
              </RBarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">Aucune donnée disponible.</p>
          )}
        </div>

        {/* Actualités par catégorie (si exposé) */}
        {actualitesParCategorie.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Actualités par catégorie</h2>
              {actualitesScope === "all" ? (
                <span className="text-xs text-gray-500">
                  ⚠️ Aucune actualité pour {actualitesYear} — affichage toutes années confondues.
                </span>
              ) : (
                <span className="text-xs text-gray-500">Année {actualitesYear}</span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-sm">
                {actualitesParCategorie.map((item, i) => (
                  <li key={`${item.categorie}-${i}`} className="flex justify-between border-b py-1">
                    <span>{item.categorie}</span>
                    <span className="font-semibold">{item.total}</span>
                  </li>
                ))}
              </ul>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart data={actualitesParCategorie.map(a => ({ name: a.categorie, total: a.total }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" />
                  </RBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
