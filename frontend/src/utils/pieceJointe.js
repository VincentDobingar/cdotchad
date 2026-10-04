// URL publique d'une pièce jointe d'avis ou d'offre (stockée dans uploads/documents).
export function urlPieceJointe(nomFichier) {
  if (!nomFichier) return null;
  if (nomFichier.startsWith("http")) return nomFichier;
  return `${window.location.origin}/backend/uploads/documents/${nomFichier}`;
}
