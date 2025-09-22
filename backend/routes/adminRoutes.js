// ✅ src/routes/admin/index.jsx
import DashboardHome from "@/pages/admin/DashboardHome";

import FormActualite from "@/pages/admin/FormActualite";
import AdminActualites from "@/pages/admin/AdminActualites";

import AdminGalerie from "@/pages/admin/AdminGalerie";

import AdminUtilisateurs from "@/pages/admin/AdminUtilisateurs";
import FormUtilisateur from "@/pages/admin/FormUtilisateur";

import AdminOffres from "@/pages/admin/AdminOffres";
import AdminFormOffre from "@/pages/admin/AdminFormOffre";
import OffreSuccess from "@/pages/admin/OffreSuccess";

import AdminCandidatures from "@/pages/admin/AdminCandidatures";
import GestionAdmins from "@/pages/admin/GestionAdmins";

import NotFound from "@/pages/NotFound";
import RolePrivateRoute from "@/components/RolePrivateRoute";
import { 
  LayoutDashboard, 
  Newspaper, 
  Users, 
  Briefcase, 
  UserCheck, 
  ImageIcon, 
  ShieldCheck } 
from "lucide-react";

const adminRoutes = [
  // Dashboard
  {
    index: true,
    element: <DashboardHome />,
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    path: "dashboard",
    element: <DashboardHome />,
  },

  // Actualités
  {
    path: "actualites",
    element: <AdminActualites />,
    label: "Actualités",
    icon: <Newspaper className="w-5 h-5" />,
  },
  { path: "actualites/ajouter", element: <FormActualite /> },
  { path: "actualites/edit/:id", element: <FormActualite /> },

  // Offres
  {
    path: "offres",
    element: <AdminOffres />,
    label: "Offres",
    icon: <Briefcase className="w-5 h-5" />,
  },
  { path: "offres/ajouter", element: <AdminFormOffre /> },
  { path: "offres/modifier/:id", element: <AdminFormOffre editMode={true} /> },
  { path: "offres/:id/success", element: <OffreSuccess /> },

  // Candidatures
  {
    path: "candidatures",
    element: <AdminCandidatures />,
    label: "Candidatures",
    icon: <UserCheck className="w-5 h-5" />,
  },

  // Utilisateurs
  {
    path: "utilisateurs",
    element: <AdminUtilisateurs />,
    label: "Utilisateurs",
    icon: <Users className="w-5 h-5" />,
  },
  { path: "utilisateurs/ajouter", element: <FormUtilisateur /> },
  { path: "utilisateurs/edit/:id", element: <FormUtilisateur /> },

  // Super Admins
  {
    path: "gestion-admins",
    element: (
      <RolePrivateRoute allowedRoles={["superAdmin"]}>
        <GestionAdmins />
      </RolePrivateRoute>
    ),
    label: "Gestion Admins",
    icon: <ShieldCheck className="w-5 h-5" />,
    superAdmin: true,
  },

  // Galerie
  {
    path: "galerie",
    element: <AdminGalerie />,
    label: "Galerie",
    icon: <ImageIcon className="w-5 h-5" />,
  },

  // Fallback interne admin
  {
    path: "*",
    element: <NotFound />,
  },
];

export default adminRoutes;
