// 📁 utils/analyze-logs.js
import fs from "fs";
import path from "path";

// 📌 Adapte le chemin à ton dossier logs
const logPath = path.resolve("logs/requests.log");

const ipCounts = {};

fs.readFile(logPath, "utf-8", (err, data) => {
  if (err) {
    console.error("❌ Impossible de lire requests.log :", err.message);
    return;
  }

  const lines = data.split("\n");

  lines.forEach((line) => {
    const ipMatch = line.match(/IP: ([\d.:a-fA-F]+)/);
    if (ipMatch) {
      const ip = ipMatch[1];
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }
  });

  const sorted = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]);

  console.log("📊 Requêtes par IP (Top 10) :");
  sorted.slice(0, 10).forEach(([ip, count]) => {
    console.log(`- ${ip}: ${count} requêtes`);
  });

  const suspectIPs = sorted.filter(([, count]) => count > 100);
  if (suspectIPs.length) {
    console.log("\n🚫 IPs suspectes à bloquer dans .htaccess :");
    suspectIPs.forEach(([ip]) => {
      console.log(`Deny from ${ip}`);
    });
  } else {
    console.log("\n✅ Aucun comportement suspect détecté.");
  }
});
