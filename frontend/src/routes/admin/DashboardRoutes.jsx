import DashboardHome from "@/pages/admin/DashboardHome";
import AnalysePremium from "@/pages/admin/AnalysePremium";
import { BarChart2, Sparkles } from "lucide-react";

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
  {
    path: "analyse",
    element: <AnalysePremium />,
    label: "Analyse premium",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

export default dashboardRoutes;