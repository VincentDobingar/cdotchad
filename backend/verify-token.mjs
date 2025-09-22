// testToken.mjs
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkBjZHRjaGFkLmNvbSIsInJvbGUiOiJzdXBlcmFkbWluIiwiaWF0IjoxNzU0MDU3ODYxLCJleHAiOjE3NTQwNjg2NjF9.vYsjAJc4fsq2gArldU4ICKCSEWdcdp4XdTkFw7gMLIY"; // ⚠️ remplace par le vrai token complet
const secret = process.env.JWT_SECRET || "cdosecret123"; // même logique que le login

// (Optionnel) voir le payload sans vérifier la signature
try {
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  console.log("Payload décodé:", payload);
  if (payload?.exp) {
    console.log("Expire le:", new Date(payload.exp * 1000).toString());
  }
} catch (_) {
  console.log("⚠️ Impossible de décoder le payload (token mal copié ?)");
}

// Vérification de la signature + expiration
try {
  const decoded = jwt.verify(token, secret);
  console.log("✅ Token VALIDE:", decoded);
} catch (error) {
  console.error("❌ Token INVALIDE:", error.name, "-", error.message);
}
