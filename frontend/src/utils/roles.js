// src/utils/roles.js
export const roleOf = (a) =>
  String(a?.role ?? a?.user_role ?? a?.type ?? "").toLowerCase();

export const isSuperAdmin = (a) =>
  a?.isSuperAdmin === true ||
  a?.superAdmin === true ||
  a?.super_admin === true ||
  roleOf(a) === "superadmin" ||
  a?.role === 99;

export const isAdmin = (a) =>
  a?.isAdmin === true || isSuperAdmin(a) || roleOf(a) === "admin";
