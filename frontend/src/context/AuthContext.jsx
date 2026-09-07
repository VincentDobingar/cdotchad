// src/context/AuthContext.jsx
// Contexte d'authentification unique, tous rôles (candidat/partenaire/admin/superadmin).
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/utils/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const ADMIN_ROLES = ["admin", "superadmin"];
const TOKEN_KEYS = ["adminToken", "userToken"];

// Un seul token actif à la fois : la clé de stockage suit le rôle du compte
// connecté (admin/superadmin -> adminToken, candidat/partenaire -> userToken),
// pour rester compatible avec les écrans qui lisent encore ces clés directement
// (ImportDBButton, ResetDBButton, AdminCandidatureDetail, AdminCreateUser...).
const storageKeyFor = (role) => (ADMIN_ROLES.includes(role) ? "adminToken" : "userToken");

const getToken = () => {
  for (const key of TOKEN_KEYS) {
    const t = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (t) return t;
  }
  return null;
};

const setAuthHeader = (token) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

const clearStorages = () => {
  for (const key of TOKEN_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking"); // "checking" | "authenticated" | "unauthenticated"
  const [user, setUser] = useState(null); // { id, email, role, nom?, prenom? }

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data?.user || null);
      setStatus("authenticated");
    } catch {
      clearStorages();
      setAuthHeader(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  // Au montage : si token → header + /auth/me, sinon non-authentifié.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("unauthenticated");
      setUser(null);
      return;
    }
    setAuthHeader(token);
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seul point d'écriture du storage — tous les écrans de login doivent passer par là.
  // roleHint permet de choisir la bonne clé de stockage quand la réponse de login
  // ne renvoie pas déjà l'objet utilisateur complet (ex: session cookie-only).
  const login = async ({ token, user: userPayload, remember = true, roleHint } = {}) => {
    const role = userPayload?.role || roleHint;
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(storageKeyFor(role), token);
    setAuthHeader(token);

    if (userPayload?.role) {
      setUser(userPayload);
      setStatus("authenticated");
    } else {
      await fetchMe();
    }
  };

  const logout = () => {
    clearStorages();
    setAuthHeader(null);
    setUser(null);
    setStatus("unauthenticated");
  };

  const value = useMemo(
    () => ({ status, user, login, logout, refreshMe: fetchMe }),
    [status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
