// src/context/AuthContext.jsx
// Contexte d'authentification unique, tous rôles (candidat/partenaire/admin/superadmin).
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/utils/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const getToken = () =>
  localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

const setAuthHeader = (token) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

const clearStorages = () => {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
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
  const login = async ({ token, user: userPayload, remember = true }) => {
    (remember ? localStorage : sessionStorage).setItem("authToken", token);
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

  const value = useMemo(() => ({ status, user, login, logout }), [status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
