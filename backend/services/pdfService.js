import PDFDocument from "pdfkit";
import getStream from "get-stream";


export const generateCandidaturesPDF = (res, titreOffre, candidatures) => {
  const doc = new PDFDocument();
  res.setHeader("Content-Disposition", `attachment; filename="candidatures_${titreOffre}.pdf"`);
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);
  doc.fontSize(18).text(`Candidatures pour : ${titreOffre}`, { align: "center", underline: true });
  doc.moveDown();

  candidatures.forEach((c, i) => {
    doc.fontSize(12)
      .text(`Candidat ${i + 1}`, { underline: true })
      .text(`Nom        : ${c.nom}`)
      .text(`Email      : ${c.email}`)
      .text(`Téléphone  : ${c.telephone}`)
      .text(`Commentaire: ${c.commentaire || "-"}`)
      .text(`Date       : ${new Date(c.date_candidature).toLocaleString()}`)
      .moveDown();
  });

  doc.end();
};


export const generatePDFBuffer = async ({ nom, email, telephone, offreTitre, commentaire }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      doc.fontSize(20).text("📄 Fiche de Candidature / Application Summary", { align: "center" });
      doc.moveDown();

      doc.fontSize(14).text(`🧑 Nom / Name : ${nom}`);
      doc.text(`📧 Email : ${email}`);
      doc.text(`📞 Téléphone / Phone : ${telephone}`);
      doc.text(`💼 Offre / Position  : ${offreTitre}`);
      if (commentaire) {
        doc.text(`💬 Commentaire / Comment : ${commentaire}`);
      }

      // ✅ Signature
      doc.moveDown().fontSize(12).fillColor("gray").text("Document généré automatiquement par CDO Tchad", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
