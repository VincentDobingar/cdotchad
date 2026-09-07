import { Wrench } from "lucide-react";
import AdminServices from "@/pages/admin/AdminServices";

const ServicesRoutes = [
    {
        path: "services",
        element: <AdminServices />,
        label: "Services",
        icon: <Wrench className="w-5 h-5" />,
    }
];

export default ServicesRoutes;