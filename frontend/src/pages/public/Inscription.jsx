// src/pages/public/Inscription.jsx
// Création d'un compte candidat. Connecte automatiquement le candidat à la fin.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, Bell, UserRound } from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

const AVANTAGES = [
  { icone: UserRound, texte: "Un profil unique, réutilisé pour toutes vos candidatures." },
  { icone: FileText, texte: "Vos CV, lettres et diplômes enregistrés en lieu sûr." },
  { icone: Bell, texte: "Un suivi clair : chaque changement de statut vous est signalé." },
];

const champ =
  "w-full border border-sable rounded-lg px-3 py-2.5 bg-ivoire/40 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge transition";

export default function Inscription() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ prenom: "", nom: "", email: "", motdepasse: "", confirmation: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (form.motdepasse !== form.confirmation) {
      setErr("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        motdepasse: form.motdepasse,
      });

      await login({
        token: data.accessToken,
        user: data.utilisateur,
        remember: true,
        roleHint: "candidat",
      });

      navigate("/profile");
    } catch (error) {
      setErr(error?.response?.data?.message || "Inscription impossible. Réessayez.");
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
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight">Candidater en quelques clics</h1>
          <p className="mt-4 text-white/80">
            Créez votre compte candidat une fois, puis postulez aux offres sans rien ressaisir.
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
          <h2 className="font-display text-3xl text-encre">Créer mon compte candidat</h2>
          <p className="mt-1 text-sm text-graphite/70">Votre compte vous permet d'enregistrer vos documents et de suivre vos candidatures.</p>

          {err && (
            <div className="mt-6 text-sm text-rougeprofond bg-rouge/10 border border-rouge/20 rounded-lg p-3">{err}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-encre">Prénom</span>
                <input name="prenom" value={form.prenom} onChange={handleChange} autoComplete="given-name" className={`${champ} mt-1.5`} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-encre">Nom</span>
                <input name="nom" value={form.nom} onChange={handleChange} autoComplete="family-name" className={`${champ} mt-1.5`} />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-encre">Adresse e-mail</span>
              <input type="email" name="email" required value={form.email} onChange={handleChange} autoComplete="email" className={`${champ} mt-1.5`} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-encre">Mot de passe</span>
              <input
                type="password"
                name="motdepasse"
                required
                minLength={8}
                value={form.motdepasse}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${champ} mt-1.5`}
              />
              <span className="mt-1 block text-xs text-graphite/70">8 caractères minimum.</span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-encre">Confirmer le mot de passe</span>
              <input
                type="password"
                name="confirmation"
                required
                minLength={8}
                value={form.confirmation}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${champ} mt-1.5`}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-rouge hover:bg-rougeprofond text-white py-3 rounded-full font-semibold shadow-sm shadow-rouge/20 disabled:opacity-60 transition"
            >
              {loading ? "Création…" : "Créer mon compte"}
              {!loading && <CheckCircle2 className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-8 border-t border-sable pt-6 text-sm text-center text-graphite">
            Déjà inscrit ?{" "}
            <Link to="/login" className="font-semibold text-rouge hover:text-rougeprofond hover:underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
