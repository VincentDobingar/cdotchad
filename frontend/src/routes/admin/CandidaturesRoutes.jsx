// ✅ src/routes/admin/candidaturesRoutes.js
import AdminCandidatures from "@/pages/admin/AdminCandidatures";
import CandidatureDetail from "@/pages/admin/CandidatureDetail";
import AdminCandidatureDetail from "@/pages/admin/AdminCandidatureDetail";
import RolePrivateRoute from "@/components/RolePrivateRoute";
import { UserCheck } from "lucide-react";

const candidaturesRoutes = [
  { path: "candidatures", element: <AdminCandidatures />, label: "Candidatures", icon: <UserCheck className="w-5 h-5" /> },
  { path: "candidatures/:offreId", element: <AdminCandidatures /> },
  { path: "candidature/:id", element: <CandidatureDetail /> },
  {
    path: "candidature/detail/:id",
    element: <RolePrivateRoute allowedRoles={["admin"]}><AdminCandidatureDetail /></RolePrivateRoute>,
  },
];

export default candidaturesRoutes;