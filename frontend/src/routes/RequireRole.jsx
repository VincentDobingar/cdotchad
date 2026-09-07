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

  if (!hasAccess) {
    return <Navigate to={`${redirectTo}?next=${next}`} replace />;
  }

  return children ?? <Outlet />;
}
