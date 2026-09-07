import { pool } from "./config/db.js";

(async () => {
  try {
    const r = await pool.query("SELECT NOW()");
    console.log("✅ PG OK:", r.rows[0]);
  } catch (err) {
    console.error("❌ PG ERROR:", err.message);
    console.error(err.stack);
  } finally {
    try { await pool.end(); } catch(_) {}
    process.exit();
  }
})();
