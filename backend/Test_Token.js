import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU0Njc1NzE2LCJleHAiOjE3NTA4MDExMTZ9.JpjbE25xYbKPav7NzkPyK07XnWQXUofeLaVGWWEmRUQ";

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("✅ Token valide :", decoded);
} catch (error) {
  console.error("❌ Token invalide ou expiré :", error.message);
}