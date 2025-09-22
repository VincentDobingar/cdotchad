import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export { pool };
