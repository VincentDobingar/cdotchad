import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "checking") {
    // petit loader neutre pour éviter le flicker
    return (
      <div className="w-full py-10 flex items-center justify-center text-gray-500">
        Vérification de la session…
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
