// src/utils/statutCandidature.js
// Source unique des statuts de candidature, partagée entre l'espace candidat
// et l'admin (badges, labels, options de formulaire).
export const STATUTS = {
  recue: { label: "Reçue", className: "bg-gray-100 text-gray-700" },
  en_cours: { label: "En cours", className: "bg-blue-100 text-blue-700" },
  entretien: { label: "Entretien", className: "bg-yellow-100 text-yellow-800" },
  acceptee: { label: "Acceptée", className: "bg-green-100 text-green-700" },
  refusee: { label: "Refusée", className: "bg-red-100 text-red-700" },
};

export const statutLabel = (s) => STATUTS[s]?.label || s;
