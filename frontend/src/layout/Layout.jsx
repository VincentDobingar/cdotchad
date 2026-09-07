
// src/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTheme } from "@/context/ThemeContext";

export default function Layout() {
  const { darkMode } = useTheme();
  return (
     <div className={darkMode ? "dark" : ""}>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
        <Outlet />
      </main>
    </div>
  );
}