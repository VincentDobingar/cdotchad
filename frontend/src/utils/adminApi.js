// 📁 src/utils/adminApi.js
import api from "@/utils/api";

/* ================== SERVICES ================== */
export async function fetchServices(params) {
  const { data } = await api.get("/services", { params });
  return data;
}
export async function ajouterService(payload) {
  const { data } = await api.post("/services", payload);
  return data;
}
export async function modifierService(id, payload) {
  const { data } = await api.put(`/services/${id}`, payload);
  return data;
}
export async function supprimerService(id) {
  const { data } = await api.delete(`/services/${id}`);
  return data;
}

/* ================== OFFRES ================== */
export async function fetchOffres(params) {
  const { data } = await api.get("/offres", { params });
  return data;
}
export async function ajouterOffre(payload) {
  const { data } = await api.post("/offres", payload);
  return data;
}
export async function modifierOffre(id, payload) {
  const { data } = await api.put(`/offres/${id}`, payload);
  return data;
}
export async function supprimerOffre(id) {
  const { data } = await api.delete(`/offres/${id}`);
  return data;
}

/* ================== ACTUALITÉS ================== */
export async function fetchActualites(params) {
  const { data } = await api.get("/actualites", { params });
  return data;
}
export async function fetchActualiteById(id) {
  const { data } = await api.get(`/actualites/${id}`);
  return data;
}
export async function saveActualite(payload) {
  const id = payload?.id ?? payload?._id ?? null;
  if (payload instanceof FormData) {
    if (id) {
      const { data } = await api.put(`/actualites/${id}`, payload);
      return data;
    } else {
      const { data } = await api.post("/actualites", payload);
      return data;
    }
  }
  if (id) {
    const { data } = await api.put(`/actualites/${id}`, payload);
    return data;
  } else {
    const { data } = await api.post("/actualites", payload);
    return data;
  }
}
export async function supprimerActualite(id) {
  const { data } = await api.delete(`/actualites/${id}`);
  return data;
}

/* ================== UTILISATEURS ================== */
export async function fetchUtilisateurs(params) {
  const { data } = await api.get("/utilisateurs", { params });
  return data;
}
export async function ajouterUtilisateur(payload) {
  const { data } = await api.post("/utilisateurs", payload);
  return data;
}
export async function modifierUtilisateur(id, payload) {
  const { data } = await api.put(`/utilisateurs/${id}`, payload);
  return data;
}
export const updateUtilisateur = modifierUtilisateur; // alias
export async function supprimerUtilisateur(id) {
  const { data } = await api.delete(`/utilisateurs/${id}`);
  return data;
}

/* ================== STATS ================== */
export async function fetchAdminStats(params) {
  const { data } = await api.get("/admin/stats", { params });
  return data;
}
export async function fetchAdminStatsResume(params) {
  const { data } = await api.get("/admin/stats/resume", { params });
  return data;
}

/* ================== ADMINS (gestion des admins) ================== */
/** 🔧 Ajuste ADMINS_BASE si ton backend expose autre chose (ex: "/admin/users") */
const ADMINS_BASE = "/admin/admins";

export async function getAdmins(params) {
  const { data } = await api.get(ADMINS_BASE, { params });
  return data;
}
export async function createAdmin(payload) {
  const { data } = await api.post(ADMINS_BASE, payload);
  return data;
}
export async function updateAdmin(id, payload) {
  const { data } = await api.put(`${ADMINS_BASE}/${id}`, payload);
  return data;
}
export async function deleteAdmin(id) {
  const { data } = await api.delete(`${ADMINS_BASE}/${id}`);
  return data;
}

/** ✅ Reset du mot de passe d’un admin
 *  Attend un endpoint type: POST /backend/admin/admins/:id/reset-password
 *  payload peut contenir { nouveauMotDePasse } ou { password } selon ton backend
 */
export async function resetAdminPassword(id, payload = {}) {
  const { data } = await api.post(`${ADMINS_BASE}/${id}/reset-password`, payload);
  return data;
}

/* — alias utiles si certains composants utilisent d’autres noms — */
export const fetchAdmins = getAdmins;
export const ajouterAdmin = createAdmin;
export const modifierAdmin = updateAdmin;
export const supprimerAdmin = deleteAdmin;
