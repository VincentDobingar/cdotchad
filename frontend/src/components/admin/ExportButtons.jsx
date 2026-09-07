// 📁 src/components/admin/ExportButtons.jsx
import { FileText, FileDown } from "lucide-react";

/**
 * Boutons PDF + CSV
 */
export default function ExportButtons({ onPdf, onCsv }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onPdf}
        className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
      >
        <FileText className="w-4 h-4" /> Exporter PDF
      </button>
      <button
        onClick={onCsv}
        className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
      >
        <FileDown className="w-4 h-4" /> Exporter CSV
      </button>
    </div>
  );
}
