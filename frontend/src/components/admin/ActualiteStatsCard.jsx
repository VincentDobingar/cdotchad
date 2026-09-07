import { useEffect, useState } from "react";
import api from "@/utils/api";
import { BarChart2, FileDown, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AppBarChart } from "@/components/admin/Charts";

export default function ActualiteStatsCard({ reduced = false }) {
  const [stats, setStats] = useState([]);
  const [scope, setScope] = useState("year");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = {};
        if (year) params.year = year;
        if (month) params.month = month;

        // 🔄 on va taper sur /admin/stats/resume
        const res = await api.get("/admin/stats/resume", { params });

        setStats(res.data?.actualites_par_categorie || []);
        setScope(res.data?.actualites_scope || "year");
      } catch (err) {
        console.error("Erreur chargement stats actualités :", err);
      }
    };

    fetchStats();
  }, [year, month]);

  const exportPDF = async () => {
    const element = document.getElementById("actualite-stats");
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 10, width, height);
    pdf.save("stats-actualites.pdf");
  };

  const exportCSV = () => {
    const csvRows = [
      ["Catégorie", "Total"],
      ...(Array.isArray(stats) ? stats.map((item) => [item.categorie, item.total]) : []),
    ];
    const csvContent = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "stats-actualites.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 mt-6 rounded-xl shadow border"
      id="actualite-stats"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart2 className="text-indigo-500" />
          Statistiques des actualités par catégorie
        </h2>
        <div className="flex gap-2 items-center">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {[2023, 2024, 2025].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="">Tous les mois</option>
            {[
              "01","02","03","04","05","06",
              "07","08","09","10","11","12",
            ].map((m) => (
              <option key={m} value={m}>
                Mois {m}
              </option>
            ))}
          </select>
          <button
            onClick={exportPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
          >
            <FileText size={16} /> PDF
          </button>
          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
          >
            <FileDown size={16} /> CSV
          </button>
        </div>
      </div>

      {/* Message si fallback toutes années */}
      {scope === "all" && (
        <p className="text-xs text-gray-500 mb-2">
          ⚠️ Aucune actualité trouvée pour {year}, affichage toutes années confondues.
        </p>
      )}

      {Array.isArray(stats) && stats.length > 0 ? (
        reduced ? (
          <AppBarChart data={stats.map(s => ({ mois: s.categorie, total: s.total }))} xKey="mois" yKey="total" />
        ) : (
          <ul className="space-y-2">
            {stats.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span className="capitalize">{item.categorie}</span>
                <span className="font-semibold">{item.total}</span>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-gray-500">Aucune donnée disponible.</p>
      )}
    </div>
  );
}
