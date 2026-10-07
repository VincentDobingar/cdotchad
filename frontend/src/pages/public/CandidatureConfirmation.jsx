// frontend/pages/CandidatureConfirmation.jsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function CandidatureConfirmation() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/mes-candidatures");
    }, 8000); // Redirige vers le suivi après 8 secondes

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <span className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Candidature envoyée</h1>
        <p className="mt-3 text-slate-600">
          Merci pour votre intérêt. Vous pouvez suivre son avancement depuis vos candidatures. Vous serez redirigé
          automatiquement.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/mes-candidatures"
            className="inline-flex justify-center bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm"
          >
            Suivre mes candidatures
          </Link>
          <Link
            to="/offres"
            className="inline-flex justify-center border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-medium"
          >
            Voir les autres offres
          </Link>
        </div>
      </div>
    </div>
  );
}
