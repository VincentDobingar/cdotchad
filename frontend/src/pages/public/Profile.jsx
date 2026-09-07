// src/pages/public/Profile.jsx
import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const [nom, setNom] = useState(user?.nom || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || user?.avatarUrl || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setNom(user?.nom || "");
    setAvatarUrl(user?.avatar_url || user?.avatarUrl || "");
    setBio(user?.bio || "");
  }, [user]);

  const save = async () => {
    try {
      await api.put("/utilisateurs/me", { nom, avatar_url: avatarUrl, bio });
      await refreshMe();
      setMessage("Enregistré.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Mise à jour échouée.");
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    await api.put("/utilisateurs/me/password", { oldPassword, newPassword });
  };

  return (
    <div>
      <h2>Profile</h2>
      <div>Email: {user?.email}</div>

      <div>
        <label>Nom</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} />
      </div>

      <div>
        <label>Avatar URL</label>
        <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
      </div>

      <div>
        <label>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <button onClick={save}>Save</button>

      <h3>Changer de mot de passe</h3>
      <PasswordForm onChangePassword={changePassword} />

      {message && <div>{message}</div>}
    </div>
  );
}

// Petit composant interne pour changer le mdp
function PasswordForm({ onChangePassword }) {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await onChangePassword(currentPassword, newPassword);
      setMsg("Mot de passe changé.");
      setCurrent("");
      setNew("");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Impossible de changer le mot de passe.");
    }
  };

  return (
    <form onSubmit={submit}>
      <input type="password" placeholder="Ancien mot de passe" value={currentPassword} onChange={(e)=>setCurrent(e.target.value)} required />
      <input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(e)=>setNew(e.target.value)} required />
      <button type="submit">Changer de mot de passe</button>
      {msg && <div>{msg}</div>}
    </form>
  );
}
