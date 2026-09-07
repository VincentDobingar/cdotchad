// 📁 src/components/admin/StatCard.jsx
import React from "react";

export default function StatCard({ title, icon, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex items-center gap-4">
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
        {icon}
      </div>
      <div>
        <h2 className="text-sm text-gray-500 dark:text-gray-300">{title}</h2>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
