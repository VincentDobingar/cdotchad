// utils/tokens.js
import jwt from "jsonwebtoken";
export function signAccess(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_EXPIRES || "15m" });
}
export function signRefresh(user) {
  // refresh token can include minimal info, or a random id stored in DB for rotation
  return jwt.sign({ id: user.id }, process.env.REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_EXPIRES || "7d" });
}
