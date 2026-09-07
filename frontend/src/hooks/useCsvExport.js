// 📁 src/hooks/useCsvExport.js
/**
 * Hook CSV export
 */
import Papa from "papaparse";
import { saveAs } from "file-saver";

export default function useCsvExport() {
  function exportCSV(rows, filename = "export") {
    const safeRows = Array.isArray(rows) ? rows : [];
    const csv = Papa.unparse(safeRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${filename}.csv`);
  }
  return { exportCSV };
}
