const express = require('express');
const router = express.Router();
const pool = require('../Config/db');

// Obtener lista de roles 
router.get('/roles', async (req, res) => {
  const result = await pool.query('SELECT * FROM rol');
  res.json(result.rows);
});

// Crear nuevo rol
router.post('/roles', async (req, res) => {
  const { nombre } = req.body;
  const result = await pool.query('INSERT INTO rol (nombre) VALUES ($1) RETURNING *', [nombre]);
  res.json(result.rows[0]);
});

// Obtener stakeholders de un proyecto
router.get('/proyecto/:id_proyecto', async (req, res) => {
  const { id_proyecto } = req.params;
  const query = `
    SELECT s.*, r.nombre as nombre_rol 
    FROM stakeholder s
    LEFT JOIN rol r ON s.id_rol = r.id_rol
    WHERE s.id_proyecto = $1
  `;
  const result = await pool.query(query, [id_proyecto]);
  res.json(result.rows);
});

// Crear Stakeholder que este vinculado a un proyecto
router.post('/', async (req, res) => {
  const { nombre, email, id_rol, id_proyecto } = req.body;
  const query = `
    INSERT INTO stakeholder (nombre, email, id_rol, id_proyecto)
    VALUES ($1, $2, $3, $4) RETURNING *
  `;
  const result = await pool.query(query, [nombre, email, id_rol, id_proyecto]);
  res.json(result.rows[0]);
});

module.exports = router;