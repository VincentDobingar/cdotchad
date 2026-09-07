// src/utils/imgUrl.js
export function toPublicImageUrl(raw, cacheKey) {
  if (!raw) return "";

  let v = String(raw).trim();

  // Si absolue → remap /api/uploads OU /uploads → /backend/uploads et force l'origin courant
  if (/^https?:\/\//i.test(v)) {
    v = v.replace(/\/(?:api\/)?uploads/gi, "/backend/uploads");
    try {
      const u = new URL(v);
      const o = new URL(window.location.origin);
      u.protocol = o.protocol;
      u.host = o.host; // évite le cross-origin bloqué par CSP
      v = u.toString();
    } catch {/* on retombe plus bas */}
    // Ajout du cache-buster si demandé
    if (cacheKey) v += (v.includes("?") ? "&" : "?") + "v=" + encodeURIComponent(cacheKey);
    return v;
  }

  // Si relative → nettoie les préfixes et préfixe /backend
  v = v
    .replace(/^\/?api\//i, "")
    .replace(/^\/?backend\//i, "")
    .replace(/^\/+/, "");

  if (!/^uploads\//i.test(v)) v = `uploads/${v}`;

  let url = `${window.location.origin}/backend/${v}`;
  if (cacheKey) url += `?v=${encodeURIComponent(cacheKey)}`;
  return url;
}

export function withBuster(url, key) {
  const k = key ? String(key) : "";
  return url ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(k)}` : url;
}
