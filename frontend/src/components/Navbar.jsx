// src/components/Navbar.jsx

import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import logo from "/images/logo-cdotchad.png";
import { useAuth } from "@/context/AuthContext";

// Menu
const navItems = [
  { label: "Accueil", to: "/" },
  { label: "Présentation", to: "/presentation" },
  { label: "Services", to: "/services" },
  { label: "Objectifs", to: "/objectifs" },
  { label: "Activités", to: "/activites" },
  { label: "Carrière", to: "/offres" },
  { label: "Actualités", to: "/actualites" },
  { label: "Galerie", to: "/galerie" },
  { label: "Contact", to: "/contact" },
];

const SCROLL_Y = 60;
const BRAND_RED_HEX = "#C62828";
const USE_SOLID_RED_ON_LIGHT = true;
const PREFER_DARK_TEXT_ON_OTHER_PAGES = false;

function parseRgb(c) {
  const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (!m) return { r: 255, g: 255, b: 255, a: 1 };
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
}

function relLuma({ r, g, b }) {
  const srgb = [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function getEffectiveBg(el) {
  let node = el;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const bg = parseRgb(cs.backgroundColor);
    if (bg.a && bg.a > 0) return bg;
    node = node.parentElement;
  }
  return parseRgb(getComputedStyle(document.body).backgroundColor);
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { status = "unauthenticated", admin, logout } = useAuth() || {};
  const user = admin ?? null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState("solid-red");

  const isCareerActive =
    location.pathname.startsWith("/offres") || location.pathname.startsWith("/postuler");

  function recomputeMode() {
    const atTop = window.scrollY <= SCROLL_Y;
    const hero =
      document.querySelector("[data-hero]") ||
      document.getElementById("hero") ||
      document.querySelector(".hero");
    const isHome = location.pathname === "/";

    if (hero && isHome && atTop) {
      const bg = getEffectiveBg(hero);
      const dark = relLuma(bg) < 0.4;
      if (dark) return setMode("transparent-light");
    }

    setMode(USE_SOLID_RED_ON_LIGHT ? "solid-red" : "solid-white-redtext");
  }

  useEffect(() => {
    setMenuOpen(false);
    recomputeMode();

    const onScroll = () => recomputeMode();
    const onResize = () => recomputeMode();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [location.pathname]);

  const otherText = PREFER_DARK_TEXT_ON_OTHER_PAGES ? "text-gray-900" : "text-white";
  const linkOnOther = PREFER_DARK_TEXT_ON_OTHER_PAGES
    ? "text-gray-900 hover:text-gray-700"
    : "text-white/90 hover:text-white";

  const headerClasses =
    mode === "transparent-light"
      ? "bg-transparent text-white backdrop-blur-[2px]"
      : mode === "solid-red"
      ? "bg-red-800 text-white shadow-md"
      : "bg-white text-[color:var(--brand-red)] border-b border-gray-100";

  const linkBase = "inline-flex items-center text-sm md:text-[15px] font-medium transition-colors";
  const linkOnHome = "text-white/90 hover:text-white";
  const activeUnderline =
    "relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-current";

  const handleLogout = () => {
    if (typeof logout === "function") logout();
    navigate("/");
  };

  const authDesktop = (() => {
    if (status === "checking") {
      return <span className="text-sm text-white/80">Loading…</span>;
    }

    if (status === "authenticated" && user) {
      return (
        <div className="flex items-center gap-3">
          <Link to="/profile" className={`${linkBase} ${linkOnOther}`}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="avatar"
                className="h-8 w-8 rounded-full mr-2 object-cover"
              />
            ) : null}
            <span className="whitespace-nowrap">
              {user.nom || user.name || user.email}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="hidden md:inline-flex items-center px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-sm"
          >
            Logout
          </button>
        </div>
      );
    }

    return null;
  })();

  const authMobile = (() => {
    if (status === "checking") {
      return <div className="px-3 py-2 text-sm">Loading…</div>;
    }

    if (status === "authenticated" && user) {
      return (
        <div className="px-3 py-2 space-y-2">
          <Link
            to="/profile"
            className="block px-3 py-2 rounded-lg hover:bg-white/10"
            onClick={() => setMenuOpen(false)}
          >
            {user.nom || user.email}
          </Link>

          <button
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      );
    }

    return null;
  })();

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${headerClasses}`}
      style={{ "--brand-red": BRAND_RED_HEX }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="CDO Tchad" className="h-10 w-auto select-none" draggable={false} />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const forceCareer = item.to === "/offres" && isCareerActive;
            const useHomeStyle = mode === "transparent-light";

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    linkBase,
                    useHomeStyle ? linkOnHome : linkOnOther,
                    isActive || forceCareer ? activeUnderline : "opacity-90",
                  ].join(" ")
                }
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center">{authDesktop}</div>

        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40"
          onClick={() => setMenuOpen((s) => !s)}
          aria-label="Ouvrir le menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={[
          "md:hidden transition-all duration-300 overflow-hidden",
          menuOpen ? "max-h-[480px]" : "max-h-0",
          mode === "transparent-light"
            ? "bg-black/60 backdrop-blur"
            : mode === "solid-red"
            ? "bg-red-800"
            : "bg-white",
        ].join(" ")}
      >
        <nav className="px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const forceCareer = item.to === "/offres" && isCareerActive;
            const useHomeStyle = mode === "transparent-light";

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "block rounded-lg px-3 py-2",
                    useHomeStyle
                      ? "text-white/90 hover:text-white"
                      : mode === "solid-red"
                      ? otherText
                      : "text-[color:var(--brand-red)] hover:text-red-700",
                    isActive || forceCareer ? "bg-white/10 hover:bg-white/10" : "hover:bg-white/10",
                  ].join(" ")
                }
                end={item.to === "/"}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {authMobile}
      </div>
    </header>
  );
}