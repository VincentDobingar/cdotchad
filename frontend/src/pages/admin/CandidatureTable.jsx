import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Download } from "lucide-react";
import { STATUTS } from "@/utils/statutCandidature";

export default function CandidatureTable({ candidatures, onDelete, onSelect, onSort, onStatutChange, sortField, sortDirection }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getSortIndicator = (field) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? "▲" : "▼";
  };

  const telechargerPiecesJointes = (c) => {
    const zip = new JSZip();
    if (c.cv_path) zip.file("CV.pdf", fetch(`/${c.cv_path}`).then((res) => res.blob()));
    if (c.lettre_path) zip.file("Lettre.pdf", fetch(`/${c.lettre_path}`).then((res) => res.blob()));
    if (c.diplome_path) zip.file("Diplome.pdf", fetch(`/${c.diplome_path}`).then((res) => res.blob()));

    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pieces_jointes_${c.nom}.zip`;
      a.click();
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = candidatures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(candidatures.length / itemsPerPage);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="py-3 px-4 font-semibold cursor-pointer" onClick={() => onSort("nom")}>Nom {getSortIndicator("nom")}</th>
            <th className="py-3 px-4 font-semibold cursor-pointer" onClick={() => onSort("titre_offre")}>Offre</th>
            <th className="py-3 px-4 font-semibold cursor-pointer" onClick={() => onSort("date_candidature")}>Date {getSortIndicator("date_candidature")}</th>
            <th className="py-3 px-4 font-semibold">Statut</th>
            <th className="py-3 px-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((c) => (
            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4">{c.nom}</td>
              <td className="py-3 px-4">{c.titre_offre}</td>
              <td className="py-3 px-4">{new Date(c.date_candidature).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-center">
                <select
                  value={c.statut || "recue"}
                  onChange={(e) => onStatutChange(c.id, e.target.value)}
                  className={`border rounded px-2 py-1 text-xs ${STATUTS[c.statut]?.className || ""}`}
                >
                  {Object.entries(STATUTS).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4 space-x-3">
                <button
                  onClick={() => onSelect(c)}
                  className="text-slate-700 font-medium hover:text-red-700"
                >
                  Voir détails
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="text-red-700 font-medium hover:underline"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => telechargerPiecesJointes(c)}
                  className="text-slate-500 hover:text-slate-900"
                  title="Télécharger pièces"
                >
                  <Download className="inline w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          ◀ Précédent
        </button>
        <span className="text-sm">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          Suivant ▶
        </button>
      </div>
    </div>
  );
}
