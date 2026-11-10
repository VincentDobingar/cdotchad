// src/utils/formation.js
// Aides partagées par les pages de la plateforme de formation.
import api from "@/utils/api";

export const messageErreur = (err, defaut = "Une erreur est survenue.") =>
  err?.response?.data?.message || err?.response?.data?.error || defaut;

export const dateFr = (d, options = { day: "numeric", month: "long", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("fr-FR", options) : "—";

export const dateHeureFr = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

export const fcfa = (n) => (Number(n) > 0 ? `${Number(n).toLocaleString("fr-FR")} FCFA` : "Gratuite");

export const duree = (minutes) => {
  const m = Number(minutes) || 0;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} h${r ? ` ${String(r).padStart(2, "0")}` : ""}` : `${r} min`;
};

export const pct = (v) => (v == null ? "—" : `${Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);

export const taille = (o) => {
  const n = Number(o) || 0;
  if (n > 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} Go`;
  if (n > 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} Mo`;
  return `${Math.max(1, Math.round(n / 1024))} Ko`;
};

export const STATUT_INSCRIPTION = {
  en_attente: { label: "En attente de validation", className: "bg-amber-100 text-amber-800" },
  validee: { label: "Inscription validée", className: "bg-green-100 text-green-800" },
  refusee: { label: "Non retenue", className: "bg-gray-200 text-gray-700" },
  annulee: { label: "Annulée", className: "bg-gray-200 text-gray-700" },
};

export const STATUT_SEANCE = {
  a_venir: { label: "À venir", className: "bg-sable text-encre" },
  ouverte: { label: "En direct", className: "bg-rouge text-white" },
  terminee: { label: "Terminée", className: "bg-gray-200 text-gray-700" },
  annulee: { label: "Annulée", className: "bg-gray-200 text-gray-500 line-through" },
};

/** Ouvre un fichier privé (lien temporaire délivré par l'API). */
export async function ouvrirLien(chemin, { telecharger = false } = {}) {
  const { data } = await api.get(chemin, { params: telecharger ? { telecharger: 1 } : {} });
  if (telecharger) {
    const a = document.createElement("a");
    a.href = data.url;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(data.url, "_blank", "noopener");
  }
  return data;
}
