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
    <div className="min-h-screen bg-ivoire pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl border border-sable p-8">
          <h1 className="font-display text-3xl text-encre">Suivre ma candidature</h1>
          <p className="mt-2 text-sm text-graphite/70">
            Saisissez le code de suivi qui vous a été communiqué lors de votre candidature
            (de la forme <span className="font-mono">CDO-XXXXXXXX</span>). Aucune connexion nécessaire.
          </p>

          <form onSubmit={rechercher} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CDO-XXXXXXXX"
              className="flex-1 border border-sable rounded-lg px-3 py-2.5 font-mono tracking-wide bg-ivoire/40 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-rouge hover:bg-rougeprofond text-white px-5 py-2.5 rounded-full font-semibold shadow-sm disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {loading ? "Recherche…" : "Suivre"}
            </button>
          </form>

          {err && (
            <div className="mt-5 text-sm text-rouge bg-rouge/5 border border-rouge/20 rounded-lg p-3">{err}</div>
          )}

          {resultat && (
            <div className="mt-6 border-t border-sable pt-6">
              <p className="text-sm text-graphite/70">Poste concerné</p>
              <p className="font-display text-lg text-encre">{resultat.titre_offre || "Offre supprimée"}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-graphite/70">Statut actuel</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    STATUTS[resultat.statut]?.className || "bg-sable text-encre"
                  }`}
                >
                  {statutLabel(resultat.statut)}
                </span>
              </div>

              <p className="mt-4 text-xs text-graphite/60">
                Candidature du {new Date(resultat.date_candidature).toLocaleDateString("fr-FR")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
