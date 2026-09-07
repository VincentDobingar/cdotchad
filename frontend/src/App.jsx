// 📁 src/App.jsx
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// --- Layouts ---
import MainLayout from "@/layout/MainLayout.jsx";
import AdminLayout from "@/layout/AdminLayout.jsx";

// --- Auth guards ---
import RequireRole from "@/routes/RequireRole";

// --- Pages Admin ---
import AdminLogin from "@/pages/admin/AdminLogin";

// --- Config de routes ---
import adminRoutes from "@/routes/admin/Index";
import publicRoutes from "@/routes/PublicRoutes";

function RouteLogger() {
  const location = useLocation();

  useEffect(() => {
    console.log("ROUTE ACTIVE:", location.pathname + location.search);
  }, [location]);

  return null;
}

export default function App() {
  const adminBaseRoutes = adminRoutes.filter((r) => !r.superAdmin);
  const adminSuperRoutes = adminRoutes.filter((r) => r.superAdmin);

  return (
    <>
      <RouteLogger />

      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<RequireRole roles={["admin", "superadmin"]} />}>
          <Route element={<AdminLayout />}>
            {adminBaseRoutes.map((r, i) =>
              r.index ? (
                <Route key={`admin-index-${i}`} index element={r.element} />
              ) : (
                <Route key={`admin-${r.path}-${i}`} path={r.path} element={r.element} />
              )
            )}

            {adminSuperRoutes.length > 0 && (
              <Route element={<RequireRole roles={["superadmin"]} />}>
                {adminSuperRoutes.map((r, i) =>
                  r.index ? (
                    <Route key={`admin-sa-index-${i}`} index element={r.element} />
                  ) : (
                    <Route key={`admin-sa-${r.path}-${i}`} path={r.path} element={r.element} />
                  )
                )}
              </Route>
            )}
          </Route>
        </Route>

        <Route element={<MainLayout />}>
          {publicRoutes.map((r, i) =>
            r.index ? (
              <Route key={`public-index-${i}`} index element={r.element} />
            ) : (
              <Route key={`public-${r.path}-${i}`} path={r.path} element={r.element} />
            )
          )}
        </Route>

        <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
      </Routes>
    </>
  );
}