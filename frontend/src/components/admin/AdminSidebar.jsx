// 📁 src/components/admin/AdminSidebar.jsx
import { useState, useEffect } from "react";
import { NavLink as RouterLink, useLocation } from "react-router-dom";
import { LogOut, Moon, Sun, ChevronLeft, ChevronRight, Menu } from "lucide-react";

import adminRoutes from "@/routes/admin/Index";
import logo from "@/assets/logo-cdotchad.png";
import avatar from "@/assets/avatar.png";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function AdminSidebar({ email, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const { admin, logout } = useAuth() || {};
  const { darkMode, toggleTheme } = useTheme();

  // Détermination robuste du rôle
  const adminEmail = (admin?.email || localStorage.getItem("adminEmail") || "").toLowerCase();
  const role = String(admin?.role || "").toLowerCase();
  const isSuperAdmin = role === "superadmin" || adminEmail === "contact@cdotchad.com";

  // Fermer le menu mobile à chaque navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Liens visibles selon rôle (route.superAdmin => réservé)
  const visibleLinks = adminRoutes.filter(
    (route) => route.label && route.path && (!route.superAdmin || isSuperAdmin)
  );

  const sections = [
    {
      title: "Tableau de bord",
      routes: visibleLinks.filter((r) => ["dashboard", "statistiques"].includes(r.path)),
    },
    {
      title: "Contenu",
      routes: visibleLinks.filter((r) =>
        ["actualites", "galerie", "services", "partenaires", "messages"].includes(r.path)
      ),
    },
    {
      title: "Utilisateurs",
      routes: visibleLinks.filter((r) =>
        ["offres", "candidatures", "referents", "utilisateurs"].includes(r.path)
      ),
    },
    {
      title: "Administration",
      routes: visibleLinks.filter(
        (r) =>
          ![
            "dashboard",
            "actualites",
            "galerie",
            "services",
            "offres",
            "candidatures",
            "utilisateurs",
            "messages",
          ].includes(r.path)
      ),
    },
  ];

  return (
    <>
      {/* Barre mobile */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 shadow">
        <button onClick={() => setSidebarOpen((o) => !o)} aria-label="Ouvrir le menu">
          <Menu size={24} className="text-gray-800 dark:text-white" />
        </button>
        <span className="font-semibold text-gray-700 dark:text-white">Espace Admin</span>
      </div>

      <aside
        className={`text-sm fixed top-0 left-0 h-full z-50 shadow-lg border-r
          transform transition-transform duration-300 md:static md:block
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${sidebarCollapsed ? "w-20" : "w-64"} p-4
          ${
            darkMode
              ? "bg-gradient-to-b from-gray-900 to-gray-800 text-white"
              : "bg-gradient-to-b from-white via-red-50 to-white text-gray-800"
          }`}
      >
        <div className="flex justify-between items-center mb-4">
          <RouterLink to="/admin/dashboard" aria-label="Aller au tableau de bord">
            <img
              src={logo}
              alt="CDO Tchad"
              className={`object-contain ${sidebarCollapsed ? "h-12 mx-auto" : "h-20"}`}
              draggable={false}
            />
          </RouterLink>

          {!sidebarCollapsed && (
            <button
              onClick={toggleTheme}
              className="text-gray-500 dark:text-gray-300 hover:text-red-500"
              aria-label="Basculer le thème"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="hidden md:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={sidebarCollapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="space-y-4">
          {sections.map((section, idx) =>
            section.routes.length > 0 ? (
              <div key={idx}>
                {!sidebarCollapsed && (
                  <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 px-2 mb-2">
                    {section.title}
                  </h4>
                )}
                <div className="space-y-1">
                  {section.routes.map(({ path, label, icon }, i) => (
                    <RouterLink
                      key={i}
                      to={`/admin/${path}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 group
                        ${
                          isActive
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-white font-semibold"
                            : "hover:bg-red-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        }`
                      }
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">
                        {icon}
                      </span>
                      {!sidebarCollapsed && <span>{label}</span>}
                    </RouterLink>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </nav>

        {!sidebarCollapsed && (
          <div className="mt-10 text-xs text-gray-600 dark:text-gray-400 border-t pt-4 flex items-center gap-2">
            <img src={avatar} alt="Admin" className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <p className="font-medium">
                {email || adminEmail || "Administrateur"}
                {role && (
                  <span className="ml-2 inline-block rounded bg-gray-100 dark:bg-gray-700 px-2 py-[2px] text-[10px] uppercase tracking-wide">
                    {role}
                  </span>
                )}
              </p>
              <button
                onClick={() => (onLogout ? onLogout() : logout?.())}
                className="flex items-center text-red-600 hover:underline text-xs mt-1"
              >
                <LogOut size={14} className="mr-1" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
