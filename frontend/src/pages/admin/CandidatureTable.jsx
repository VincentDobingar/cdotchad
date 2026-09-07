import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Download, FileCheck } from "lucide-react";

export default function CandidatureTable({ candidatures, onDelete, onSelect, onSort, sortField, sortDirection }) {
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
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 cursor-pointer" onClick={() => onSort("nom")}>Nom {getSortIndicator("nom")}</th>
            <th className="py-2 px-4 cursor-pointer" onClick={() => onSort("titre_offre")}>Offre</th>
            <th className="py-2 px-4 cursor-pointer" onClick={() => onSort("date_candidature")}>Date {getSortIndicator("date_candidature")}</th>
            <th className="py-2 px-4">Statut</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((c) => (
            <tr key={c.id} className="border-t hover:bg-gray-50">
              <td className="py-2 px-4">{c.nom}</td>
              <td className="py-2 px-4">{c.titre_offre}</td>
              <td className="py-2 px-4">{new Date(c.date_candidature).toLocaleDateString()}</td>
              <td className="py-2 px-4 text-center">
                <FileCheck className="inline text-green-600" title="Candidature reçue" />
              </td>
              <td className="py-2 px-4 space-x-2">
                <button
                  onClick={() => onSelect(c)}
                  className="text-blue-600 hover:underline"
                >
                  Voir détails
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="text-red-600 hover:underline"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => telechargerPiecesJointes(c)}
                  className="text-gray-600 hover:text-black"
                  title="Télécharger pièces"
                >
                  <Download className="inline w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          ◀ Précédent
        </button>
        <span className="text-sm">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Suivant ▶
        </button>
      </div>
    </div>
  );
}
