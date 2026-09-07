// src/routes/RequireSuperAdmin.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireSuperAdmin() {
  const { status, admin } = useAuth();

  if (status === "checking") {
    return <div className="w-full py-10 text-center text-gray-500">Vérification…</div>;
  }

  const isSuperAdmin = admin?.role === "superadmin";

  if (!isSuperAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
