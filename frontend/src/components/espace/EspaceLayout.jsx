// src/components/espace/EspaceLayout.jsx
// Coque commune des espaces connectés (candidat, partenaire) : barre latérale sur
// ordinateur, barre défilante sur mobile. Les liens dépendent du rôle connecté.
import { NavLink, useNavigate } from "react-router-dom";
import { FileText, LayoutDashboard, LogOut, PlusCircle, Search, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import NotificationsCloche from "@/components/NotificationsCloche";

const LIENS_CANDIDAT = [
  { to: "/profile", label: "Mon profil", icon: User },
  { to: "/mes-candidatures", label: "Mes candidatures", icon: FileText },
  { to: "/offres", label: "Trouver une offre", icon: Search },
];

const LIENS_PARTENAIRE = [
  { to: "/partenaire", label: "Mes avis", icon: LayoutDashboard, end: true },
  { to: "/partenaire/avis/nouveau", label: "Soumettre un avis", icon: PlusCircle },
  { to: "/profile", label: "Ma fiche et mot de passe", icon: Settings },
];

const ROLES = { candidat: "Espace candidat", partenaire: "Espace partenaire" };

export default function EspaceLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tant que le mot de passe provisoire n'est pas changé, seul le profil est accessible
  const liens = user?.role === "partenaire"
    ? user.doit_changer_mdp
      ? LIENS_PARTENAIRE.filter((l) => l.to === "/profile")
      : LIENS_PARTENAIRE
    : LIENS_CANDIDAT;

  const deconnexion = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Barre latérale (ordinateur) */}
      <aside className="hidden md:flex fixed top-16 bottom-0 left-0 w-64 flex-col bg-white border-r border-slate-200">
        <div className="px-6 py-6 border-b border-slate-100">
          <p className="text-xs uppercase tracking-wider text-red-700 font-semibold">
            {ROLES[user?.role] || "Espace"}
          </p>
          <p className="mt-1 font-semibold truncate">{user?.nom || user?.email}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {liens.map(({ to, label, icon: Icone, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-red-50 text-red-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icone className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={deconnexion}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Barre défilante (mobile) */}
      <div className="md:hidden fixed top-16 inset-x-0 z-40 bg-white border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {liens.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium ${
                  isActive ? "bg-red-700 text-white" : "text-slate-600 bg-slate-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="md:ml-64 pt-16 md:pt-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-28 md:pt-10 pb-16">
          <header className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-sm text-slate-500">Bonjour{user?.nom ? `, ${user.nom}` : ""}</p>
              <h1 className="text-2xl font-bold tracking-tight">{ROLES[user?.role] || "Mon espace"}</h1>
            </div>
            <div className="bg-white rounded-full border border-slate-200 shadow-sm">
              <NotificationsCloche />
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
