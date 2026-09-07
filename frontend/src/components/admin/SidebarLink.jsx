import { NavLink } from "react-router-dom";

export default function SidebarLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded hover:bg-red-100 ${
          isActive ? "bg-red-200 font-semibold text-red-800" : "text-gray-700"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
