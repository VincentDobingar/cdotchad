// src/routes/admin/ModerationRoutes.jsx
import AdminModerationAvis from "@/pages/admin/AdminModerationAvis";
import { ShieldCheck } from "lucide-react";

const moderationRoutes = [
  {
    path: "moderation",
    element: <AdminModerationAvis />,
    label: "Modération avis",
    icon: <ShieldCheck />,
    superAdmin: false,
  },
];

export default moderationRoutes;
