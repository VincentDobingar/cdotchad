process.env.UNDICI_NO_WASM = '1';   // 👈 disable undici WASM early

(async () => {
  try {
    await import('./index.js');
  } catch (err) {
    console.error("❌ Erreur attrapée dans index.cjs :", err);
    process.exit(1);
  }
})();
