// src/components/formation/AdminUi.jsx
// Petits composants d'interface communs aux écrans d'administration des formations.
import { X } from "lucide-react";

export const champCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:ring-red-600 bg-white";

export function Champ({ label, aide, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {aide && <span className="block text-xs text-gray-500 mt-1">{aide}</span>}
    </label>
  );
}

export function Carte({ titre, actions, children, className = "" }) {
  return (
    <section className={`bg-white border rounded-2xl shadow-sm ${className}`}>
      {(titre || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b">
          {titre && <h2 className="font-semibold text-gray-900">{titre}</h2>}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const VARIANTES = {
  primaire: "bg-red-600 text-white hover:bg-red-700",
  secondaire: "border border-gray-300 text-gray-800 hover:bg-gray-50 bg-white",
  sombre: "bg-gray-900 text-white hover:bg-gray-800",
  danger: "text-red-700 hover:bg-red-50",
};

export function Bouton({ variante = "primaire", className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
    />
  );
}

export function Badge({ className = "bg-gray-100 text-gray-700", children }) {
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}

export function Modale({ titre, onFermer, children, large = false }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className={`w-full ${large ? "max-w-3xl" : "max-w-lg"} bg-white rounded-2xl shadow-xl my-8`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">{titre}</h2>
          <button type="button" onClick={onFermer} className="p-1.5 rounded-full hover:bg-gray-100" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Chiffre({ label, valeur, aide }) {
  return (
    <div className="bg-white border rounded-2xl shadow-sm p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{valeur ?? "—"}</p>
      {aide && <p className="text-xs text-gray-500 mt-0.5">{aide}</p>}
    </div>
  );
}

/** Valeur d'un <input type="datetime-local"> à partir d'une date ISO, en heure locale. */
export function versDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const STATUT_FORMATION = {
  brouillon: { label: "Brouillon", className: "bg-yellow-100 text-yellow-800" },
  publiee: { label: "Publiée", className: "bg-green-100 text-green-800" },
  archivee: { label: "Archivée", className: "bg-gray-200 text-gray-700" },
};

export const STATUT_SESSION = {
  ouverte: { label: "Inscriptions ouvertes", className: "bg-green-100 text-green-800" },
  fermee: { label: "Inscriptions fermées", className: "bg-orange-100 text-orange-800" },
  terminee: { label: "Terminée", className: "bg-gray-200 text-gray-700" },
  annulee: { label: "Annulée", className: "bg-gray-200 text-gray-500" },
};
