// client/src/context/UserAuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../utils/api";

const UserAuthContext = createContext(null);
export const useUserAuth = () => useContext(UserAuthContext);

const readToken = () => localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
const saveToken = (token, remember = true) => {
  if (remember) localStorage.setItem("userToken", token);
  else sessionStorage.setItem("userToken", token);
};
const clearToken = () => { localStorage.removeItem("userToken"); sessionStorage.removeItem("userToken"); };

export function UserAuthProvider({ children }) {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);

  const setAuthHeader = (token) => {
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete api.defaults.headers.common["Authorization"];
  };

  const loadFromStorage = async () => {
    const token = readToken();
    if (!token) { setStatus("unauthenticated"); return; }
    setAuthHeader(token);
    try {
      const { data } = await api.get("/users/profil");
      setUser(data);
      setStatus("authenticated");
    } catch {
      clearToken();
      setAuthHeader(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => { loadFromStorage(); }, []);

  const login = async ({ email, motdepasse, remember = true }) => {
    const res = await api.post("/utilisateurs/login", { email, motdepasse });
    const { token, utilisateur } = res.data;
    saveToken(token, remember);
    setAuthHeader(token);
    setUser(utilisateur);
    setStatus("authenticated");
    return utilisateur;
  };

  const register = async ({ email, motdepasse, nom, remember = true }) => {
    await api.post("/utilisateurs/register", { email, motdepasse, nom });
    return login({ email, motdepasse, remember });
  };

  const logout = () => {
    clearToken();
    setAuthHeader(null);
    setUser(null);
    setStatus("unauthenticated");
  };

  const value = useMemo(() => ({ status, user, login, register, logout, setUser }), [status, user]);

  return <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>;
}
