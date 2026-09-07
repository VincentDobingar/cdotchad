// src/routes/admin/Index.jsx
import dashboardRoutes from "./DashboardRoutes";
import offresRoutes from "./OffresRoutes";
import actualitesRoutes from "./ActualitesRoutes";
import candidaturesRoutes from "./CandidaturesRoutes";
import galerieRoutes from "./GalerieRoutes";
import utilisateursRoutes from "./UtilisateursRoutes";
import messagesRoutes from "./MessagesRoutes";
import Unauthorized from "@/pages/admin/Unauthorized";
import ServicesRoutes from "./ServicesRoutes";
import NotFound from "@/pages/NotFound";
import debugRoutes from "./DebugRoutes";

const adminRoutes = [
  ...dashboardRoutes,
  ...offresRoutes,
  ...actualitesRoutes,
  ...candidaturesRoutes,
  ...galerieRoutes,
  ...utilisateursRoutes,
  ...ServicesRoutes,
  ...debugRoutes,
  ...messagesRoutes,
  { path: "*", element: <NotFound /> },
  { path: "unauthorized", element: <Unauthorized />, },
];

export default adminRoutes;
