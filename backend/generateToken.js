import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const token = jwt.sign(
  {
    id: 2,
    email: "admin@cdtchad.com",
    role: "superadmin",
  },
  process.env.JWT_SECRET,
  { expiresIn: "3h" }
);

console.log("✅ Nouveau token :", token);