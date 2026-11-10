// src/components/admin/AdminAuthLayout.jsx
// Coque « premium » des écrans d'accès à l'administration (connexion, mot de passe
// oublié, réinitialisation), alignée sur la connexion candidats et partenaires.
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, GraduationCap, ShieldCheck } from "lucide-react";

const POINTS = [
  { icone: ShieldCheck, texte: "Accès réservé à l'équipe CDO, chaque action sensible est journalisée." },
  { icone: BarChart3, texte: "Offres, candidatures, partenaires et contenus du site au même endroit." },
  { icone: GraduationCap, texte: "Formations en ligne : sessions, replays, évaluations et certificats." },
];

export const champAuthCls =
  "mt-1.5 w-full border border-sable rounded-lg px-3 py-2.5 bg-ivoire/40 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge transition";

export const boutonAuthCls =
  "w-full inline-flex items-center justify-center gap-2 bg-rouge hover:bg-rougeprofond text-white py-3 rounded-full font-semibold shadow-sm shadow-rouge/20 disabled:opacity-60 transition";

export default function AdminAuthLayout({ titre, sousTitre, children }) {
  return (
    <div className="min-h-screen bg-ivoire grid lg:grid-cols-2">
      {/* Panneau de présentation */}
      <aside className="relative hidden lg:flex flex-col justify-between px-16 py-12 bg-gradient-to-br from-encre via-encre to-rougeprofond text-white overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-rouge/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-rougeprofond/30 blur-3xl" aria-hidden="true" />
        <Link to="/" className="relative z-10 inline-flex">
          <img src="/images/logo-cdo-navbar-v2.png" alt="CDO Consulting" className="h-14 w-auto" />
        </Link>
        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2.5 text-sm font-medium text-white/75">
            <span className="h-px w-8 bg-rouge" aria-hidden="true" />
            Espace administration
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight">Piloter le site CDO Tchad</h1>
          <p className="mt-4 text-white/80">Connectez-vous avec votre compte d'administration pour gérer les contenus et les services du cabinet.</p>
          <ul className="mt-10 space-y-5">
            {POINTS.map(({ icone: Icone, texte }) => (
              <li key={texte} className="flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icone className="w-5 h-5" />
                </span>
                <span className="text-white/85">{texte}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/50">© {new Date().getFullYear()} CDO Consulting Tchad</p>
      </aside>

      {/* Formulaire */}
      <main className="flex flex-col items-center justify-center px-4 py-12">
        <Link to="/" className="lg:hidden mb-8">
          <img src="/images/logo-cdo.png" alt="CDO Consulting" className="h-14 w-auto" />
        </Link>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-sable p-8">
          <h2 className="font-display text-3xl text-encre">{titre}</h2>
          {sousTitre && <p className="mt-1 text-sm text-graphite/70">{sousTitre}</p>}
          {children}
        </div>
        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-rouge">
          <ArrowLeft className="w-4 h-4" /> Retour au site
        </Link>
      </main>
    </div>
  );
}
