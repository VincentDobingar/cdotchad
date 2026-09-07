// ✅ src/routes/admin/actualitesRoutes.js
import AdminActualites from "@/pages/admin/AdminActualites";
import FormActualite from "@/pages/admin/FormActualite";
import { Newspaper } from "lucide-react";

const actualitesRoutes = [
  { path: "actualites", element: <AdminActualites />, label: "Actualités", icon: <Newspaper className="w-5 h-5" /> },
  { path: "actualites/ajouter", element: <FormActualite /> },
  { path: "actualites/edit/:id", element: <FormActualite /> },
];

export default actualitesRoutes;