// src/routes/admin/FormationsRoutes.jsx
// Plateforme de formation en ligne (analyse technique DBS Africa, nov. 2026).
import AdminFormations from "@/pages/admin/formations/AdminFormations";
import AdminFormationDetail from "@/pages/admin/formations/AdminFormationDetail";
import AdminSession from "@/pages/admin/formations/AdminSession";
import AdminEvaluation from "@/pages/admin/formations/AdminEvaluation";
import { GraduationCap } from "lucide-react";

const formationsRoutes = [
  {
    path: "formations",
    element: <AdminFormations />,
    label: "Formations",
    icon: <GraduationCap />,
    superAdmin: false,
  },
  { path: "formations/nouvelle", element: <AdminFormationDetail /> },
  { path: "formations/sessions/:id", element: <AdminSession /> },
  { path: "formations/evaluations/:id", element: <AdminEvaluation /> },
  { path: "formations/:id", element: <AdminFormationDetail /> },
];

export default formationsRoutes;
