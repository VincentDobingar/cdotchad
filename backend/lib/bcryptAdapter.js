// ESM, Node 20
let lib;
try {
  // essaie la version native (plus rapide)
  lib = await import('bcrypt');
} catch {
  // fallback 100% JS (passe partout sur cPanel)
  lib = await import('bcryptjs');
}

// mêmes signatures dans les deux libs : renvoient des Promises si sans callback
export const hash = (plain, saltRounds = 10) => lib.hash(plain, saltRounds);
export const compare = (plain, hashed) => lib.compare(plain, hashed);

export default { hash, compare };
