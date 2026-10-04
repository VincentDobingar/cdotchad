// src/routes/admin/PartenairesRoutes.jsx
import AdminPartenaires from "@/pages/admin/AdminPartenaires";
import { Handshake } from "lucide-react";

const partenairesRoutes = [
  {
    path: "partenaires",
    element: <AdminPartenaires />,
    label: "Partenaires",
    icon: <Handshake />,
    superAdmin: false,
  },
];

export default partenairesRoutes;
