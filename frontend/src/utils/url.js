// src/utils/url.js
export const API_BASE = "/backend"; // même base que ton backend

export function imgUrl(p) {
  if (!p) return "";
  if (p.startsWith("http")) return p;            // URL absolue déjà OK
  const clean = p.replace(/^\/?uploads\//, "uploads/"); // évite // et normalise
  return `${API_BASE}/${clean}`;
}
