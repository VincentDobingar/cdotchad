import { useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ThemeContext } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MainLayout() {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  // Pas de pied de page sur les tableaux de bord (espaces connectés) ni sur les pages de connexion et d'inscription
  const isEspaceRoute = /^\/(profile|mes-candidatures|partenaire)(\/|$)/.test(location.pathname);
  const isAuthRoute = /^\/(login|inscription)(\/|$)/.test(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar />}

      <main className="flex-grow">
        <Outlet />
      </main>

      {!isAdminRoute && !isEspaceRoute && !isAuthRoute && <Footer />}
    </div>
  );
}