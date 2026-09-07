// 📁 src/pages/admin/ExportDemo.jsx
import { useRef, useMemo } from "react";
import usePdfExport from "@/hooks/usePdfExport";
import useCsvExport from "@/hooks/useCsvExport";
import ExportButtons from "@/components/admin/ExportButtons";

export default function ExportDemo() {
  const exportRef = useRef();

  // Données bidon pour tester
  const data = [
    ["Statistiques globales"],
    ["Candidatures", 11],
    ["Utilisateurs", 1],
    ["Offres", 6],
    ["Actualités", 6],
  ];

  // Prépare CSV une fois
  const csvRows = useMemo(() => data, [data]);

  // Hooks export
  const { exportPDF } = usePdfExport(exportRef, {
    title: "CDOTCHAD - Rapport de Statistiques (DEMO)",
    header: "Année : 2025",
    filePrefix: "rapport-stats-demo",
  });
  const { exportCSV } = useCsvExport();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Demo Export PDF/CSV</h1>

      <ExportButtons
        onPdf={exportPDF}
        onCsv={() => exportCSV(csvRows, "stats-resume-demo")}
      />

      {/* Contenu exportable */}
      <div ref={exportRef} className="mt-6 border rounded p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2">Aperçu export</h2>
        <ul className="list-disc pl-6">
          {data.slice(1).map((row, i) => (
            <li key={i}>
              {row[0]} : <strong>{row[1]}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
