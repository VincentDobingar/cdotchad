// ✅ src/routes/admin/OffresRoutes.js
import AdminOffres from "@/pages/admin/AdminOffres";
import AdminFormOffre from "@/pages/admin/AdminAjoutOffre";
import OffreSuccess from "@/pages/admin/OffreSuccess";
import { FilePlus } from "lucide-react";

const offresRoutes = [
  {
    path: "offres",
    element: <AdminOffres />,
    label: "Offres",
    icon: <FilePlus />,
    superAdmin: false,
  },
  {
    path: "offres/ajouter",
    element: <AdminFormOffre />,
  },
  {
    path: "offres/modifier/:id",
    element: <AdminFormOffre />,
  },
  {
    path: "offres/:id/success",
    element: <OffreSuccess />,
  },
];

export default offresRoutes;
