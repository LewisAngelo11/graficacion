import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';

const router = Router();

// Crear tecnica de observacion
router.post('/:id_subproceso', async (req: Request, res: Response) => {
  try {
    const { id_subproceso } = req.params;
    const { titulo, descripcion } = req.body;

    // Crea la técnica base
    const tecnicaRecolecion = await prisma.tecnica_recoleccion.create({
      data: {
        id_tecnica_catalogo: Number(2),
        titulo: titulo,
        descripcion: descripcion,
        id_subproceso: Number(id_subproceso),
        estatus: "Planificada"
      }
    });

    // Crea la observación en autimático
    await prisma.observacion.create({
      data: {
        id_tecnica: Number(tecnicaRecolecion.id_tecnica)
      }
    });

    res.json(tecnicaRecolecion);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Todas las observaciones
router.get('/', async (req: Request, res: Response) => {
  try {
    const observaciones = await prisma.observacion.findMany({
      include: { tecnica_recoleccion: true }
    });
    res.json(observaciones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener la observación por su id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const observacion = await prisma.observacion.findUnique({
      where: { id_observacion: Number(req.params.id) },
      include: {
        tecnica_recoleccion: true,
        observacion_detalle: true,
        stakeholder: true,
      }
    });
    if (!observacion) return res.status(404).json({ error: 'Observación no encontrada' });
    res.json(observacion);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar observacion
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      id_stakeholder,
      ubicacion,
      fecha,
      duracion,
      hallazgos,
      observaciones
    } = req.body;

    // Actualizar observación principal
    const observacion = await prisma.observacion.update({
      where: {
        id_observacion: Number(id)
      },
      data: {
        id_stakeholder: id_stakeholder && id_stakeholder !== 0
          ? Number(id_stakeholder) : null,
        ubicacion: ubicacion,
        fecha: fecha ? new Date(fecha) : null,
        duracion: Number(duracion),
        hallazgos: hallazgos
      }
    });

    // Eliminar detalles anteriores
    await prisma.observacion_detalle.deleteMany({
      where: {
        id_observacion: Number(id)
      }
    });

    // Crear nuevos detalles
    if (observaciones.length > 0) {
      await prisma.observacion_detalle.createMany({
        data: observaciones.map((obs: any) => ({
          id_observacion: Number(id),
          hora: obs.hora,
          categoria: obs.categoria,
          descripcion: obs.descripcion
        }))
      });
    }

    res.json({
      ok: true,
      observacion
    });

  } catch (error: any) {
    res.status(400).json({
      error: error.message
    });
    console.log(error);
  }
});

export default router;