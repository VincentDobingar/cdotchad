// install_fetch.js
import { exec } from "child_process";
exec("npm install node-fetch", (err, stdout, stderr) => {
  if (err) console.error("Erreur install:", err);
  else console.log("✔️ node-fetch installé :", stdout);
});