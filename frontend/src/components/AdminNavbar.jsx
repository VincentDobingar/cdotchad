// src/components/AdminNavbar.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow">
      <h1 className="text-xl font-bold">Espace Admin</h1>

      <div className="flex gap-4 items-center">
        <button
          onClick={() => navigate("/admin/offres")}
          className="hover:underline"
        >
          Offres
        </button>
        <button
          onClick={() => navigate("/admin/candidatures")}
          className="hover:underline"
        >
          Candidatures
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
        >
          Se déconnecter
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;