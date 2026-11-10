// src/pages/public/VerifierCertificat.jsx
// Page publique ouverte par le QR code d'un certificat : confirme son authenticité.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, SearchCheck, ShieldX } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import api from "@/utils/api";
import { dateFr, pct } from "@/utils/formation";

export default function VerifierCertificat() {
  const { numero } = useParams();
  const navigate = useNavigate();
  const [saisie, setSaisie] = useState(numero || "");
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!numero) {
      setResultat(null);
      return;
    }
    setChargement(true);
    api
      .get(`/formations/certificats/verifier/${encodeURIComponent(numero)}`)
      .then(({ data }) => setResultat(data))
      .catch(() => setResultat({ valide: false, message: "Vérification impossible pour le moment. Réessayez plus tard." }))
      .finally(() => setChargement(false));
  }, [numero]);

  const c = resultat?.certificat;

  return (
    <div className="bg-ivoire min-h-screen">
      <PageHero label="Certificats" title="Vérifier un certificat" intro="Saisissez le numéro inscrit sur le certificat, ou scannez son QR code." />
      <section className="max-w-2xl mx-auto px-6 py-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (saisie.trim()) navigate(`/certificats/verifier/${encodeURIComponent(saisie.trim())}`);
          }}
          className="flex gap-3"
        >
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="CDO-2026-000123-A1B2C3"
            className="flex-1 rounded-xl border border-sablefonce bg-white px-4 py-3 font-mono text-sm uppercase focus:border-rouge focus:ring-rouge"
          />
          <button className="inline-flex items-center gap-2 rounded-xl bg-rouge text-white px-5 py-3 text-sm font-semibold hover:bg-rougeprofond">
            <SearchCheck className="w-4 h-4" /> Vérifier
          </button>
        </form>

        {chargement && <p className="mt-8 text-graphite/70">Vérification…</p>}

        {resultat && !chargement && (
          <div className={`mt-8 rounded-2xl border p-6 bg-white ${resultat.valide ? "border-green-300" : "border-rouge/40"}`}>
            <div className="flex items-center gap-3">
              {resultat.valide ? <BadgeCheck className="w-8 h-8 text-green-700" /> : <ShieldX className="w-8 h-8 text-rouge" />}
              <p className={`font-semibold ${resultat.valide ? "text-green-800" : "text-rougeprofond"}`}>{resultat.message}</p>
            </div>
            {c && (
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-graphite/70">Numéro</dt><dd className="font-mono text-encre">{c.numero}</dd>
                <dt className="text-graphite/70">Titulaire</dt><dd className="font-semibold text-encre">{c.titulaire}</dd>
                <dt className="text-graphite/70">Formation</dt><dd className="text-encre">{c.formation}</dd>
                <dt className="text-graphite/70">Session</dt>
                <dd className="text-encre">{c.session}{c.date_debut ? ` (${dateFr(c.date_debut)}${c.date_fin ? ` – ${dateFr(c.date_fin)}` : ""})` : ""}</dd>
                {c.duree_heures && (<><dt className="text-graphite/70">Durée</dt><dd className="text-encre">{Number(c.duree_heures)} heures</dd></>)}
                {c.note_finale != null && (<><dt className="text-graphite/70">Note finale</dt><dd className="text-encre">{pct(c.note_finale)}</dd></>)}
                <dt className="text-graphite/70">Délivré le</dt><dd className="text-encre">{dateFr(c.delivre_le)}</dd>
                {c.revoque_le && (<><dt className="text-graphite/70">Révoqué le</dt><dd className="text-rougeprofond">{dateFr(c.revoque_le)}</dd></>)}
              </dl>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
