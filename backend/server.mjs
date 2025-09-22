import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

import testDBRoute from "./routes/test-db.js";
import testSimpleRoute from "./routes/test-simple.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors({
  origin: [
    "https://cdotchad.com",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "uploads", "cv");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Dossier uploads/cv créé");
}

app.use("/api/test-simple", testSimpleRoute);
app.use("/api/test-db", testDBRoute);

app.get(["/", "/api"], (req, res) => {
  res.json({
    status: "✅ API CDO Tchad opérationnelle",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint non trouvé",
    availableEndpoints: [
      "/api/test-simple",
      "/api/test-db"
    ]
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;