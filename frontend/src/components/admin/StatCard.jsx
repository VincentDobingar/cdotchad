// 📁 src/components/admin/StatCard.jsx
import React from "react";

const TONS = {
  rouge: "bg-red-50 text-red-700",
  bleu: "bg-blue-50 text-blue-700",
  vert: "bg-emerald-50 text-emerald-700",
  jaune: "bg-amber-50 text-amber-700",
};

export default function StatCard({ title, icon, value, tone = "rouge" }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${TONS[tone] || TONS.rouge}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}
