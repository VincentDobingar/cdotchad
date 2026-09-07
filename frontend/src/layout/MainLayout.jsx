import { useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ThemeContext } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";

export default function MainLayout() {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar />}

      <main className="flex-grow">
        <Outlet />
      </main>

      {!isAdminRoute && (
        <footer className="bg-gray-100 dark:bg-gray-900 text-center text-sm py-4 text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} CDO TCHAD. Tous droits réservés.
        </footer>
      )}
    </div>
  );
}