import DashboardHome from "@/pages/admin/DashboardHome";
import { LayoutDashboard, BarChart2 } from "lucide-react";

const dashboardRoutes = [
  {
    index: true,
    element: <DashboardHome />, // Cette route est invisible dans le menu
  },
  {
    path: "dashboard",
    element: <DashboardHome />,
    label: "Statistiques",
    icon: <BarChart2 className="w-5 h-5" />,
  },
];

export default dashboardRoutes;