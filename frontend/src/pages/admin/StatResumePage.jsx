// 📁 src/pages/admin/StatResumePage.jsx
import React, { useRef, useMemo } from "react";
import usePdfExport from "@/hooks/usePdfExport";
import useCsvExport from "@/hooks/useCsvExport";
import ExportButtons from "@/components/admin/ExportButtons";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Briefcase, Users, FileText } from "lucide-react";

import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/**
 * Contrat :
 * - Ne fetch AUCUNE donnée ici.
 * - Lit tout dans `data` (prop injectée par DashboardHome).
 * - `yearDefault` + `onYearChange` pour piloter le filtre global depuis le parent.
 * - `month` (prop) est seulement affiché.
 */
export default function StatResumePage({
  embedMode = false,
  yearDefault,
  onYearChange,
  month,
  data,
}) {
  const exportRef = useRef();
  const year = yearDefault || new Date().getFullYear();

  // Garde-fou data
  const dataOk = data && typeof data === "object" && !Array.isArray(data);
  if (!dataOk) {
    return (
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow border">
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
          <span className="ml-2">Chargement…</span>
        </div>
      </div>
    );
  }

  // Séries
  const candidaturesParMois     = Array.isArray(data.candidatures_par_mois) ? data.candidatures_par_mois : [];
  const candidaturesParOffre    = Array.isArray(data.candidatures_par_offre) ? data.candidatures_par_offre : [];
  const parTypeContrat          = Array.isArray(data.par_type_contrat) ? data.par_type_contrat : [];
  const parLieu                 = Array.isArray(data.par_lieu) ? data.par_lieu : [];
  const parEmployeur            = Array.isArray(data.par_employeur) ? data.par_employeur : [];
  const multiYearData           = Array.isArray(data.multi_year_data) ? data.multi_year_data : [];
  const actualitesParCategorie  = Array.isArray(data.actualites_par_categorie) ? data.actualites_par_categorie : [];
  const actualitesScope         = typeof data.actualites_scope === "string" ? data.actualites_scope : "year";
  const actualitesYear          = data.actualites_year ?? String(year);

  // Exports
  const header = `Année : ${year}${month ? ` - Mois : ${month}` : ""}`;
  const { exportPDF } = usePdfExport(exportRef, {
    title: "CDOTCHAD - Rapport de Statistiques",
    header,
    filePrefix: `rapport-stats-${year}${month ? `-${month}` : ""}`,
  });
  const { exportCSV } = useCsvExport();

  // CSV
  const csvRows = useMemo(() => {
    const rows = [];

    // Stats globales
    rows.push(["Statistiques globales"]);
    rows.push(["Candidatures", data.total_candidatures ?? 0]);
    rows.push(["Utilisateurs",  data.total_utilisateurs ?? 0]);
    rows.push(["Offres",        data.total_offres ?? 0]);
    rows.push(["Actualités",    data.total_actualites ?? 0]);
    rows.push([]);

    // Candidatures par mois
    rows.push(["Candidatures par mois"]);
    rows.push(["Mois", "Total"]);
    candidaturesParMois.forEach((it) => rows.push([it.mois, it.total]));
    rows.push([]);

    // Candidatures par offre
    rows.push(["Candidatures par offre"]);
    rows.push(["Offre", "Total"]);
    candidaturesParOffre.forEach((it) => rows.push([it.titre, it.total]));
    rows.push([]);

    // Par type de contrat
    rows.push(["Répartition par type de contrat"]);
    rows.push(["Type de contrat", "Total"]);
    parTypeContrat.forEach((it) => rows.push([it.type_contrat, it.total]));
    rows.push([]);

    // Top 5 régions
    rows.push(["Top 5 régions avec le plus d’offres"]);
    rows.push(["Lieu", "Total"]);
    parLieu.forEach((it) => rows.push([it.lieu, it.total]));
    rows.push([]);

    // Par employeur
    rows.push(["Répartition par employeur"]);
    rows.push(["Employeur", "Total"]);
    parEmployeur.forEach((it) => rows.push([it.employeur, it.total]));
    rows.push([]);

    // Actualités par catégorie
    rows.push([`Actualités par catégorie (scope=${actualitesScope}${actualitesScope==="year" ? `, year=${actualitesYear}` : ""})`]);
    rows.push(["Catégorie", "Total"]);
    actualitesParCategorie.forEach((it) => rows.push([it.categorie, it.total]));
    rows.push([]);

    // Évolution multi-année
    rows.push(["Évolution mensuelle multi-année"]);
    rows.push(["Mois", `${year}`, `${Number(year)+1}`]);
    for (let i = 1; i <= 12; i++) {
      const m = String(i).padStart(2, "0");
      const v1 = multiYearData.find((d) => d.annee === String(year) && d.mois === m)?.total || 0;
      const v2 = multiYearData.find((d) => d.annee === String(Number(year)+1) && d.mois === m)?.total || 0;
      rows.push([m, v1, v2]);
    }
    return rows;
  }, [
    data, year, month,
    candidaturesParMois, candidaturesParOffre,
    parTypeContrat, parLieu, parEmployeur,
    actualitesParCategorie, actualitesScope, actualitesYear,
    multiYearData,
  ]);

  return (
    <div className="space-y-6 px-4 py-8">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={year}
          onChange={(e) => onYearChange?.(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          {[new Date().getFullYear(), 2024, 2023, 2022].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {month && (
          <span className="text-xs text-gray-500">
            Mois filtré : <strong>{month}</strong>
          </span>
        )}

        <ExportButtons
          onPdf={exportPDF}
          onCsv={() => exportCSV(csvRows, `stats-resume-${year}${month ? `-${month}` : ""}`)}
        />
      </div>

      {/* Contenu exportable */}
      <div ref={exportRef} className="space-y-10">
        {/* 📊 Cartes principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-blue-600 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500">Candidatures</p>
                <p className="text-3xl font-bold">{data.total_candidatures ?? 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-600 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500">Utilisateurs</p>
                <p className="text-3xl font-bold">{data.total_utilisateurs ?? 0}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-indigo-600 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500">Offres</p>
                <p className="text-3xl font-bold">{data.total_offres ?? 0}</p>
              </div>
              <Briefcase className="w-8 h-8 text-indigo-600" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-rose-600 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500">Actualités</p>
                <p className="text-3xl font-bold">{data.total_actualites ?? 0}</p>
              </div>
              <FileText className="w-8 h-8 text-rose-600" />
            </CardContent>
          </Card>
        </div>

        {/* 📊 Candidatures par mois */}
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

        {/* 📋 Candidatures par offre */}
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

        {/* 📈 Répartition par type de contrat */}
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

        {/* 📍 Top 5 régions */}
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

        {/* 📊 Comparaison multi-années */}
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

        {/* 📰 Actualités par catégorie */}
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

          {actualitesParCategorie.length > 0 ? (
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
          ) : (
            <p className="text-gray-500">Aucune donnée disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}
