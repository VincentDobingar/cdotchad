// src/routes/admin/Index.jsx
import dashboardRoutes from "./DashboardRoutes";
import offresRoutes from "./OffresRoutes";
import actualitesRoutes from "./ActualitesRoutes";
import candidaturesRoutes from "./CandidaturesRoutes";
import galerieRoutes from "./GalerieRoutes";
import utilisateursRoutes from "./UtilisateursRoutes";
import messagesRoutes from "./MessagesRoutes";
import partenairesRoutes from "./PartenairesRoutes";
import moderationRoutes from "./ModerationRoutes";
import Unauthorized from "@/pages/admin/Unauthorized";
import ServicesRoutes from "./ServicesRoutes";
import NotFound from "@/pages/NotFound";
import debugRoutes from "./DebugRoutes";
import formationsRoutes from "./FormationsRoutes";

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
  ...partenairesRoutes,
  ...moderationRoutes,
  ...formationsRoutes,
  { path: "*", element: <NotFound /> },
  { path: "unauthorized", element: <Unauthorized />, },
];

export default adminRoutes;
