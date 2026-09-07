// 📁 src/hooks/usePdfExport.js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Hook PDF export
 * @param {ref} exportRef - ref sur le bloc à exporter
 * @param {Object} options - { title, header, filePrefix }
 */
export default function usePdfExport(exportRef, options = {}) {
  const exportPDF = async () => {
    if (!exportRef.current) return;

    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    // Header
    if (options.title) {
      pdf.setFontSize(14);
      pdf.text(options.title, 10, 10);
    }
    if (options.header) {
      pdf.setFontSize(10);
      pdf.text(options.header, 10, 20);
    }

    // Image
    pdf.addImage(imgData, "PNG", 0, 30, width, height);

    pdf.save(`${options.filePrefix || "rapport"}.pdf`);
  };

  return { exportPDF };
}
