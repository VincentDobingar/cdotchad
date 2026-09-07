// ✅ src/routes/admin/GalerieRoutes.js
import AdminGalerie from "@/pages/admin/AdminGalerie";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ImageIcon } from "lucide-react";

const galerieRoutes = [
  {
    path: "galerie",
    element: (
        <ErrorBoundary>
          <AdminGalerie />
        </ErrorBoundary>
    ),
    label: "Galerie",
    icon: <ImageIcon className="w-5 h-5" />,
  },
];

export default galerieRoutes;