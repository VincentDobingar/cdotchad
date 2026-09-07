
// ✅ src/routes/admin/utilisateursRoutes.js
import AdminUtilisateurs from "@/pages/admin/AdminUtilisateurs";
import FormUtilisateur from "@/pages/admin/FormUtilisateur";
import GestionAdmins from "@/pages/admin/GestionAdmins";
import { Users, ShieldCheck } from "lucide-react";

const utilisateursRoutes = [
  { path: "utilisateurs", element: <AdminUtilisateurs />, label: "Utilisateurs", icon: <Users className="w-5 h-5" /> },
  { path: "utilisateurs/ajouter", element: <FormUtilisateur /> },
  { path: "utilisateurs/edit/:id", element: <FormUtilisateur /> },
  { path: "gestion-admins", element: <GestionAdmins />, label: "Gestion Admins", icon: <ShieldCheck className="w-5 h-5" />, superAdmin: true },
];

export default utilisateursRoutes;