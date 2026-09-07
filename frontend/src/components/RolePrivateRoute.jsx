// src/components/RolePrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function RolePrivateRoute({ allowedRoles = ["admin"], children }) {
  const [state, setState] = useState({ loading: true, user: null });
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/admin/me"); // -> /backend/admin/me
        const user = data?.admin ?? data;            // ✅ supporte {admin:{...}} ou {...}
        if (alive) setState({ loading: false, user });
      } catch {
        if (alive) setState({ loading: false, user: null });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (state.loading) return <div className="p-6">Chargement…</div>;

  if (!state.user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }

  // ✅ rôle: supporte user.role (string) ou user.roles (array)
  const roles = Array.isArray(state.user.roles)
    ? state.user.roles
    : [state.user.role || "admin"];

  const hasAccess = allowedRoles.some((r) => roles.includes(r));
  if (!hasAccess) return <div className="p-6 text-red-600">Accès refusé.</div>;

  return children;
}
