import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkBjZHRjaGFkLmNvbSIsInJvbGUiOiJzdXBlcmFkbWluIiwiaWF0IjoxNzU0MDU3ODYxLCJleHAiOjE3NTQwNjg2NjF9.vYsjAJc4fsq2gArldU4ICKCSEWdcdp4XdTkFw7gMLIY";

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("✅ Token valide :", decoded);
} catch (error) {
  console.error("❌ Token invalide ou expiré :", error.message);
}
