// 📁 src/hooks/useCsvExport.js
/**
 * Hook CSV export
 *
 * exportCSV(lignes, nom, { excel: true }) produit un fichier qui s'ouvre directement
 * dans Excel en français : séparateur point-virgule et accents conservés.
 */
import Papa from "papaparse";
import { saveAs } from "file-saver";

export default function useCsvExport() {
  function exportCSV(rows, filename = "export", options = {}) {
    const safeRows = Array.isArray(rows) ? rows : [];
    // Excel en français : point-virgule, accents (BOM) et virgule décimale
    const pourExcel = (ligne) =>
      Array.isArray(ligne) ? ligne.map((v) => (typeof v === "number" ? String(v).replace(".", ",") : v)) : ligne;
    const csv = options.excel
      ? "\uFEFF" + Papa.unparse(safeRows.map(pourExcel), { delimiter: ";" })
      : Papa.unparse(safeRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${filename}.csv`);
  }
  return { exportCSV };
}
