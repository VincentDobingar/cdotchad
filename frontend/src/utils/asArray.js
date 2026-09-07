// src/utils/asArray.js
export default function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === "string" && /^[\[\{].*[\]\}]$/.test(v.trim())) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    } catch {}
  }
  return [v];
}