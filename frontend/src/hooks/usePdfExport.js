// 📁 src/hooks/usePdfExport.js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Hook PDF export
 * @param {ref} exportRef - ref sur le bloc à exporter
 * @param {Object} options - { title, header, filePrefix }
 *
 * Le bloc est photographié puis réparti sur autant de pages A4 que nécessaire
 * (un contenu plus haut qu'une page n'est plus coupé).
 */
export default function usePdfExport(exportRef, options = {}) {
  const exportPDF = async () => {
    if (!exportRef.current) return;

    // Endroits où l'on peut changer de page sans couper un bloc, par ordre de préférence :
    // le haut d'une grande partie, le haut d'une carte, puis le haut d'une ligne de tableau.
    // Ils sont relevés sur la copie que html2canvas photographie (les éléments masqués à
    // l'export n'y figurent plus), en pixels de mise en page.
    const coupes = { parties: [], blocs: [], lignes: [], largeur: 0 };
    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      onclone: (_doc, copie) => {
        const cadre = copie.getBoundingClientRect();
        const hauts = (selecteur) =>
          [...copie.querySelectorAll(selecteur)]
            .map((el) => el.getBoundingClientRect().top - cadre.top - 6)
            .filter((v) => v > 0)
            .sort((u, v) => u - v);
        coupes.largeur = cadre.width;
        coupes.parties = hauts(":scope > *");
        coupes.blocs = hauts("section, [data-pdf-bloc]");
        coupes.lignes = hauts("tr");
      },
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const largeurPage = pdf.internal.pageSize.getWidth();
    const hauteurPage = pdf.internal.pageSize.getHeight();
    const marge = 8;
    const largeur = largeurPage - marge * 2;
    const mmParPixel = largeur / canvas.width;

    // En-tête (première page)
    let y = marge;
    if (options.title) {
      pdf.setFontSize(14);
      pdf.text(options.title, marge, 12);
      y = 18;
    }
    if (options.header) {
      pdf.setFontSize(10);
      pdf.text(options.header, marge, options.title ? 19 : 12);
      y = options.title ? 25 : 18;
    }

    // Positions de coupe converties en pixels de l'image
    const echelle = coupes.largeur ? canvas.width / coupes.largeur : 0;
    const enImage = (liste) => liste.map((v) => Math.floor(v * echelle));
    const coupesParties = enImage(coupes.parties);
    const coupesBlocs = enImage(coupes.blocs);
    const coupesLignes = enImage(coupes.lignes);
    const meilleureCoupe = (liste, mini, maxi) => liste.filter((v) => v > mini && v <= maxi).pop();

    // Découpage de l'image en tranches d'une page
    let debut = 0; // en pixels dans l'image
    let premiere = true;
    while (debut < canvas.height) {
      const hauteurDispo = hauteurPage - marge - (premiere ? y : marge);
      const pleine = Math.floor(hauteurDispo / mmParPixel);
      let tranche = Math.min(canvas.height - debut, pleine);
      if (debut + tranche < canvas.height) {
        const fin =
          meilleureCoupe(coupesParties, debut + pleine * 0.6, debut + pleine) ??
          meilleureCoupe(coupesBlocs, debut + pleine * 0.5, debut + pleine) ??
          meilleureCoupe(coupesLignes, debut + pleine * 0.5, debut + pleine);
        if (fin) tranche = fin - debut;
      }
      const morceau = document.createElement("canvas");
      morceau.width = canvas.width;
      morceau.height = tranche;
      morceau.getContext("2d").drawImage(canvas, 0, debut, canvas.width, tranche, 0, 0, canvas.width, tranche);
      if (!premiere) pdf.addPage();
      // JPEG : un rapport de plusieurs pages reste léger (quelques centaines de Ko)
      pdf.addImage(morceau.toDataURL("image/jpeg", 0.9), "JPEG", marge, premiere ? y : marge, largeur, tranche * mmParPixel, undefined, "FAST");
      debut += tranche;
      premiere = false;
    }

    pdf.save(`${options.filePrefix || "rapport"}.pdf`);
  };

  return { exportPDF };
}
