// src/routes/RequireRole.jsx
// Garde de route unique, remplace ProtectedRoute.jsx, RequireSuperAdmin.jsx et
// RolePrivateRoute.jsx. Utilisable comme route-layout (<Outlet/>) ou comme
// wrapper direct (<RequireRole roles={[...]}>{element}</RequireRole>).
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireRole({ roles = [], redirectTo = "/admin/login", children }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return (
      <div className="w-full py-10 flex items-center justify-center text-gray-500">
        Vérification de la session…
      </div>
    );
  }

  const next = encodeURIComponent(location.pathname + location.search);
  const hasAccess = status === "authenticated" && (roles.length === 0 || roles.includes(user?.role));

  // Connecté mais avec un autre rôle : on renvoie vers son propre espace
  // plutôt que vers un écran de connexion qui refuserait ses identifiants.
  if (!hasAccess && status === "authenticated") {
    const home = { admin: "/admin", superadmin: "/admin", partenaire: "/partenaire", candidat: "/mes-candidatures" }[user?.role];
    if (home && home !== location.pathname) return <Navigate to={home} replace />;
  }

  if (!hasAccess) {
    return <Navigate to={`${redirectTo}?next=${next}`} replace />;
  }

  return children ?? <Outlet />;
}
