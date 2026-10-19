// frontend/pages/CandidatureConfirmation.jsx
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function CandidatureConfirmation() {
  const { state } = useLocation();
  const code = state?.code || null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <span className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Candidature envoyée</h1>
        <p className="mt-3 text-slate-600">
          Merci pour votre intérêt. Vous pouvez suivre son avancement depuis vos candidatures, ou à tout moment —
          même sans être connecté — grâce à votre code de suivi.
        </p>

        {code && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Votre code de suivi</p>
            <p className="mt-1 text-2xl font-mono font-bold tracking-wider text-red-700">{code}</p>
            <p className="mt-2 text-xs text-slate-500">
              Conservez ce code : il permet de suivre votre candidature sur la page « Suivre ma candidature » sans connexion.
            </p>
          </div>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/mes-candidatures"
            className="inline-flex justify-center bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm"
          >
            Suivre mes candidatures
          </Link>
          <Link
            to={code ? `/suivi?code=${encodeURIComponent(code)}` : "/suivi"}
            className="inline-flex justify-center border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-medium"
          >
            Suivre avec mon code
          </Link>
        </div>
      </div>
    </div>
  );
}
