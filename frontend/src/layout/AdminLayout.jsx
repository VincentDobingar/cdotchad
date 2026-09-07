// 📁 src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
