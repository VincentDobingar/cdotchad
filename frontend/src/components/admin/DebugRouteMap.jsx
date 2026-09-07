import React from "react";
import adminRoutes from "@/routes/admin/Index";

export default function DebugRouteMap() {
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4 text-red-600">🧩 Liste des adminRoutes</h2>

      <table className="w-full table-auto border border-gray-300">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">#</th>
            <th className="border p-2">Path</th>
            <th className="border p-2">Label</th>
            <th className="border p-2">Element (type)</th>
          </tr>
        </thead>
        <tbody>
          {adminRoutes.map((route, index) => (
            <tr key={index} className="border-t">
              <td className="border px-2 py-1">{index + 1}</td>
              <td className="border px-2 py-1">{route.path || "(index)"}</td>
              <td className="border px-2 py-1">{route.label || "-"}</td>
              <td className="border px-2 py-1">
                {route.element?.type?.name || "?"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
