// src/pages/public/SuiviCandidature.jsx
// Suivi public d'une candidature par code de suivi, sans connexion (#15).
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import api from "@/utils/api";
import { STATUTS, statutLabel } from "@/utils/statutCandidature";

export default function SuiviCandidature() {
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get("code") || "").toUpperCase());
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [err, setErr] = useState("");

  const rechercher = async (e) => {
    e?.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setErr("");
    setResultat(null);
    setLoading(true);
    try {
      const { data } = await api.get(`/candidatures/suivi/${encodeURIComponent(c)}`);
      setResultat(data?.suivi || null);
    } catch (e2) {
      setErr(e2?.response?.status === 404
        ? "Aucune candidature ne correspond à ce code. Vérifiez-le et réessayez."
        : "Une erreur est survenue. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h1 className="text-2xl font-bold tracking-tight text-red-700">Suivre ma candidature</h1>
          <p className="mt-1 text-sm text-slate-500">
            Saisissez le code de suivi qui vous a été communiqué lors de votre candidature
            (de la forme <span className="font-mono">CDO-XXXXXXXX</span>). Aucune connexion nécessaire.
          </p>

          <form onSubmit={rechercher} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CDO-XXXXXXXX"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {loading ? "Recherche…" : "Suivre"}
            </button>
          </form>

          {err && (
            <div className="mt-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{err}</div>
          )}

          {resultat && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-sm text-slate-500">Poste concerné</p>
              <p className="font-semibold text-slate-800">{resultat.titre_offre || "Offre supprimée"}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">Statut actuel</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    STATUTS[resultat.statut]?.className || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {statutLabel(resultat.statut)}
                </span>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Candidature du {new Date(resultat.date_candidature).toLocaleDateString("fr-FR")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
