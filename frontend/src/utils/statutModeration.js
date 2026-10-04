// Statuts de modération d'un avis de recrutement (offres.statut_moderation)
export const STATUTS_MODERATION = {
  en_attente: { label: "En attente de validation", className: "bg-yellow-100 text-yellow-800" },
  validee: { label: "Publié", className: "bg-green-100 text-green-800" },
  refusee: { label: "Refusé", className: "bg-red-100 text-red-800" },
};

export const statutModerationLabel = (statut) => STATUTS_MODERATION[statut]?.label || statut || "-";
