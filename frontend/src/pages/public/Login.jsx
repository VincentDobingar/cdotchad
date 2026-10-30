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
    <div className="min-h-screen bg-ivoire pt-16 grid lg:grid-cols-2">
      {/* Panneau de présentation */}
      <aside className="relative hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-encre via-encre to-rougeprofond text-white overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-rouge/20 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2.5 text-sm font-medium text-white/75">
            <span className="h-px w-8 bg-rouge" aria-hidden="true" />
            CDO Tchad
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight">Votre espace emploi et recrutement</h1>
          <p className="mt-4 text-white/80">
            Connectez-vous pour gérer votre profil, suivre vos candidatures ou publier vos avis de recrutement.
          </p>
          <ul className="mt-10 space-y-5">
            {AVANTAGES.map(({ icone: Icone, texte }) => (
              <li key={texte} className="flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Icone className="w-5 h-5" />
                </span>
                <span className="text-white/85">{texte}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-sable p-8">
          <h2 className="font-display text-3xl text-encre">Connexion</h2>
          <p className="mt-1 text-sm text-graphite/70">Candidats et partenaires</p>

          {err && (
            <div className="mt-6 text-sm text-rougeprofond bg-rouge/10 border border-rouge/20 rounded-lg p-3">{err}</div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-encre">Adresse e-mail</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                className="mt-1.5 w-full border border-sable rounded-lg px-3 py-2.5 bg-ivoire/40 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge transition"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-encre">Mot de passe</span>
              <input
                value={motdepasse}
                onChange={(e) => setMotdepasse(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
                className="mt-1.5 w-full border border-sable rounded-lg px-3 py-2.5 bg-ivoire/40 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge transition"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-rouge hover:bg-rougeprofond text-white py-3 rounded-full font-semibold shadow-sm shadow-rouge/20 disabled:opacity-60 transition"
            >
              {loading ? "Connexion…" : "Se connecter"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-4 text-right">
            <Link to="/mot-de-passe-oublie" className="text-sm font-medium text-rouge hover:text-rougeprofond hover:underline underline-offset-4">
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="mt-6 border-t border-sable pt-6 space-y-3 text-sm text-center text-graphite">
            <p>
              Nouveau candidat ?{" "}
              <Link to="/inscription" className="font-semibold text-rouge hover:text-rougeprofond hover:underline underline-offset-4">
                Créer mon compte
              </Link>
            </p>
            <p>
              Partenaire sans mot de passe ? Contactez l'équipe CDO pour recevoir vos accès.
            </p>
            <p>
              Administrateur ?{" "}
              <Link to="/admin/login" className="font-semibold text-rouge hover:text-rougeprofond hover:underline underline-offset-4">
                Connexion à l'espace d'administration
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
