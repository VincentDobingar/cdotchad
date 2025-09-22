import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Permet d'utiliser __dirname avec ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "routes");

const oldImports = [
  'import { verifyUserToken } from "../middlewares/authUser.js";',
  'import { verifyAdminToken } from "../middlewares/authAdmin.js";',
  'import verifyUserToken from "../middlewares/verifyUserToken.js";',
];

const newImport = 'import { verifyUserToken, verifyAdminToken } from "../middlewares/auth.js";';

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;

  for (const old of oldImports) {
    if (content.includes(old)) {
      content = content.replace(old, "");
      modified = true;
    }
  }

  if (modified) {
    content = content.replace(/^\s*\n/gm, ""); // supprimer les lignes vides
    if (!content.includes("from \"../middlewares/auth.js\"")) {
      content = newImport + "\n" + content;
    }
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✅ Corrigé : ${filePath}`);
  }
};

const walk = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (full.endsWith(".js")) processFile(full);
  }
};

walk(rootDir);
