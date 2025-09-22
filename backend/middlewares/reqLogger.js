import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, "..", "logs", "requests.log");

export const reqLogger = (req, res, next) => {
  const log = `[${new Date().toISOString()}] Requête de test IP: 127.0.0.1\n`;

  // 🔧 Forcer la création
  fs.appendFile(logFilePath, log, (err) => {
    if (err) console.error("❌ Erreur écriture requests.log :", err.message);
    else console.log("✅ requests.log écrit");
  });

  next();
};
