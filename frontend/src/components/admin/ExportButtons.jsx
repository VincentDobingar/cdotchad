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
        className="inline-flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-sm font-medium"
      >
        <FileText className="w-4 h-4" /> PDF
      </button>
      <button
        onClick={onCsv}
        className="inline-flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-sm font-medium"
      >
        <FileDown className="w-4 h-4" /> CSV
      </button>
    </div>
  );
}
