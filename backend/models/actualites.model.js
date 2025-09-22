import { pool } from '../config/db.js';

export const getAllActualites = async () => {
  const result = await pool.query('SELECT * FROM actualites ORDER BY date_creation DESC');
  return result.rows;
};

export const getActualiteById = async (id) => {
  const result = await pool.query('SELECT * FROM actualites WHERE id = $1', [id]);
  return result.rows[0];
};

export const createActualite = async (titre, contenu) => {
  const result = await pool.query(
    'INSERT INTO actualites (titre, contenu) VALUES ($1, $2) RETURNING *',
    [titre, contenu]
  );
  return result.rows[0];
};

export const updateActualite = async (id, titre, contenu) => {
  const result = await pool.query(
    'UPDATE actualites SET titre = $1, contenu = $2 WHERE id = $3 RETURNING *',
    [titre, contenu, id]
  );
  return result.rows[0];
};

export const deleteActualite = async (id) => {
  await pool.query('DELETE FROM actualites WHERE id = $1', [id]);
};
