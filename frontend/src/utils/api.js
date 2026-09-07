// client/src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/backend",
  withCredentials: true,
  timeout: 20000,
});

// Attache le Bearer adminToken OU userToken si présent
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  const userToken = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");

  const tokenToUse = adminToken || userToken;
  if (tokenToUse && !config.headers?.Authorization) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${tokenToUse}` };
  }
  return config;
});

// Refresh orchestration
let isRefreshing = false;
let pendingRequests = [];

function resolvePending(newToken) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

// Helper that tries auth refresh (calls backend /backend/auth/refresh)
async function attemptAuthRefresh() {
  try {
    // Use axios (not api) to avoid interceptor loops
    const { data } = await axios.post("/backend/auth/refresh", {}, { withCredentials: true });
    const newAccess = data?.accessToken;
    if (!newAccess) throw new Error("No access token returned by refresh");
    // Decide whether it's admin or user by current storage or payload role
    // If existing adminToken present, assume admin flow; else user flow
    const adminExists = !!(localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken"));
    if (adminExists || data.utilisateur?.role === "admin") {
      localStorage.setItem("adminToken", newAccess);
    } else {
      localStorage.setItem("userToken", newAccess);
    }
    api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
    return newAccess;
  } catch (e) {
    // clear both tokens if refresh fails
    localStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminToken");
    localStorage.removeItem("userToken");
    sessionStorage.removeItem("userToken");
    throw e;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err?.config;
    const status = err?.response?.status;

    // If no original or already retried, reject
    if (!original) return Promise.reject(err);

    // Avoid refreshing on auth routes
    const url = String(original.url || "");
    const isAuthRoute = /\/auth\/(login|register|refresh|logout)/.test(url) || /\/admin\/(login|refresh|me)/.test(url);

    // If 401 -> token expired / invalid => try refresh once
    if (status === 401 && !original.__isRetry && !isAuthRoute) {
      original.__isRetry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await attemptAuthRefresh();
          isRefreshing = false;
          resolvePending(newToken);
        } catch (e) {
          isRefreshing = false;
          resolvePending(null);
          // redirect to login page (use window.location to escape SPA state)
          const here = window.location.pathname + window.location.search;
          window.location.assign(`/login?next=${encodeURIComponent(here)}`);
          return Promise.reject(err);
        }
      }

      // queue the request until refresh finished
      return new Promise((resolve, reject) => {
        pendingRequests.push(async (token) => {
          if (!token) return reject(err);
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
          try {
            const resp = await api(original);
            resolve(resp);
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    // For other 401/403 (no refresh), clear tokens and redirect
    if ((status === 401 || status === 403) && !isAuthRoute) {
      const hadAdminToken =
        !!localStorage.getItem("adminToken") || !!sessionStorage.getItem("adminToken");

      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminToken");
      localStorage.removeItem("userToken");
      sessionStorage.removeItem("userToken");

      const here = window.location.pathname + window.location.search;

      if (hadAdminToken) {
        if (!here.startsWith("/admin/login")) {
          window.location.assign(`/admin/login?next=${encodeURIComponent(here)}`);
        }
      } else {
        if (!here.startsWith("/login")) {
          window.location.assign(`/login?next=${encodeURIComponent(here)}`);
        }
      }
    }

    return Promise.reject(err);
  }
);

export default api;
