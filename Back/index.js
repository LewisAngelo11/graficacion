require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const proyectosRoutes = require('./Routes/Proyectos.Routes');
const stakeholdersRoutes = require('./routes/interesados.proyectos.routes');
const procesosRoutes = require('./routes/procesos.routes');

const app = express();
app.use(morgan('dev'));

// Middlewares
app.use(cors());
app.use(express.json()); 

// Rutas
app.use('/api/proyectos', proyectosRoutes); 
app.use('/api/stakeholders', stakeholdersRoutes);
app.use('/api/procesos', procesosRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor jalando al 100 en el puerto ${PORT}`);
  console.log(` Base de datos: ${process.env.DB_NAME}`); 
});