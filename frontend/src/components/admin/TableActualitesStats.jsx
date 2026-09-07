// 📁 components/admin/TableActualitesStats.jsx
import React from "react";

export default function TableActualitesStats({ data }) {
  return (
    <div className="overflow-x-auto rounded shadow mt-4">
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2 border">Catégorie</th>
            <th className="px-4 py-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} className="text-center">
              <td className="px-4 py-2 border">{item.Catégorie}</td>
              <td className="px-4 py-2 border">{item.Total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
