// 📁 src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout() {
  // Sur téléphone, la barre de menu passe au-dessus du contenu (et non à côté).
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <main className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
