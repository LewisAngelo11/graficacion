const express = require('express');
const router = express.Router();
const pool = require('../Config/db');

// Obtencion de procesos de un proyecto
router.get('/proyecto/:id_proyecto', async (req, res) => {
  const { id_proyecto } = req.params;
  try {
    // Primero jalamos los procesos
    const procesos = await pool.query('SELECT * FROM proceso WHERE id_proyecto = $1', [id_proyecto]);
    
    // Para cada proceso, buscamos sus subprocesos )
    const listaCompleta = await Promise.all(procesos.rows.map(async (proc) => {
      const subs = await pool.query('SELECT * FROM subproceso WHERE id_proceso = $1', [proc.id_proceso]);
      return { ...proc, subprocesos: subs.rows };
    }));

    res.json(listaCompleta);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Crear un proceso 
router.post('/', async (req, res) => {
  const { nombre, descripcion, id_proyecto } = req.body;
  const result = await pool.query(
    'INSERT INTO proceso (nombre, descripcion, id_proyecto) VALUES ($1, $2, $3) RETURNING *',
    [nombre, descripcion, id_proyecto]
  );
  res.json(result.rows[0]);
});

// Crear un subproceso
router.post('/subproceso', async (req, res) => {
  const { nombre, descripcion, id_proceso } = req.body;
  const result = await pool.query(
    'INSERT INTO subproceso (nombre, descripcion, id_proceso) VALUES ($1, $2, $3) RETURNING *',
    [nombre, descripcion, id_proceso]
  );
  res.json(result.rows[0]);
});

module.exports = router;