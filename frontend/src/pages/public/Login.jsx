// src/pages/public/Login.jsx
// Connexion candidat et partenaire (l'espace admin a son propre écran : AdminLogin.jsx / /admin/login).
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Briefcase, FileCheck2, UserRound } from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

const AVANTAGES = [
  { icone: UserRound, texte: "Un profil et des documents enregistrés, prêts pour chaque candidature." },
  { icone: FileCheck2, texte: "Le suivi en temps réel de vos candidatures et leurs notifications." },
  { icone: Briefcase, texte: "Pour les partenaires : la publication de vos avis de recrutement." },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, motdepasse });

      await login({
        token: data.accessToken,
        user: data.utilisateur,
        remember: true,
        roleHint: "candidat",
      });

      const accueil = data.utilisateur?.role === "partenaire" ? "/partenaire" : "/profile";
      navigate(searchParams.get("next") || accueil);
    } catch (err) {
      setErr(err?.response?.data?.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16 grid lg:grid-cols-2">
      {/* Panneau de présentation */}
      <aside className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-red-900 via-red-800 to-red-700 text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-red-200">CDO Tchad</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight">Votre espace emploi et recrutement</h1>
        <p className="mt-4 text-red-100 max-w-md">
          Connectez-vous pour gérer votre profil, suivre vos candidatures ou publier vos avis de recrutement.
        </p>
        <ul className="mt-10 space-y-5">
          {AVANTAGES.map(({ icone: Icone, texte }) => (
            <li key={texte} className="flex gap-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Icone className="w-5 h-5" />
              </span>
              <span className="text-red-50">{texte}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Formulaire */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold tracking-tight">Connexion</h2>
          <p className="mt-1 text-sm text-slate-500">Candidats et partenaires</p>

          {err && (
            <div className="mt-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{err}</div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Adresse e-mail</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Mot de passe</span>
              <input
                value={motdepasse}
                onChange={(e) => setMotdepasse(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-60"
            >
              {loading ? "Connexion…" : "Se connecter"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 space-y-3 text-sm text-center text-slate-600">
            <p>
              Nouveau candidat ?{" "}
              <Link to="/inscription" className="font-medium text-red-700 hover:underline">
                Créer mon compte
              </Link>
            </p>
            <p>
              Partenaire sans mot de passe ? Contactez l'équipe CDO pour recevoir vos accès.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
