// src/utils/media.js
export function resolveMediaUrl(raw) {
  if (!raw) return "";
  let p = String(raw).trim();

  // 1) Si c'est une URL absolue, mais sur le même domaine,
  //    on normalise aussi le pathname (ex: .../api/uploads/... -> .../backend/uploads/...)
  try {
    const u = new URL(p);
    // même origine que la page OU domaine cdotchad.com → on normalise le chemin
    const sameHost =
      (typeof window !== "undefined" && u.host === window.location.host) ||
      /(^|\.)cdotchad\.com$/i.test(u.host);

    if (sameHost) {
      let pathname = u.pathname.replace(/^\/+/, ""); // rm leading /
      // normalisations de préfixes
      pathname = pathname
        .replace(/^api\//i, "")
        .replace(/^backend\//i, "")
        .replace(/^\/?backend\/uploads\//i, "uploads/")
        .replace(/^\/?api\/uploads\//i, "uploads/");

      if (!/^uploads\//i.test(pathname)) {
        const KNOWN = ["galerie", "actualites", "documents", "cv", "lettres", "diplomes"];
        if (KNOWN.some((k) => pathname.toLowerCase().startsWith(`${k}/`))) {
          pathname = `uploads/${pathname}`;
        } else {
          pathname = `uploads/galerie/${pathname}`;
        }
      }
      return `/backend/${pathname}`;
    }

    // autre domaine → on laisse tel quel (attention: CSP img-src 'self' bloquera)
    return p;
  } catch {
    // pas une URL absolue → on continue la normalisation relative
  }

  // 2) Chemins relatifs / valeurs brutes
  p = p.replace(/^\/+/, ""); // /uploads/... -> uploads/...
  p = p.replace(/^public_html\//, "");
  p = p.replace(/^public\//, "");
  p = p.replace(/^api\//i, "");
  p = p.replace(/^backend\//i, "");
  p = p.replace(/^\/?backend\/uploads\//i, "uploads/");
  p = p.replace(/^\/?api\/uploads\//i, "uploads/");

  if (!/^uploads\//i.test(p)) {
    const KNOWN = ["galerie", "actualites", "documents", "cv", "lettres", "diplomes"];
    if (KNOWN.some((k) => p.toLowerCase().startsWith(`${k}/`))) {
      p = `uploads/${p}`;
    } else {
      p = `uploads/galerie/${p}`;
    }
  }

  return `/backend/${p}`;
}
