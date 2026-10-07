// 📁 src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <main className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
