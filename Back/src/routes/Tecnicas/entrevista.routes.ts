import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';

const router = Router();

// Obtener todas las entrevistas
router.get('/', async (req: Request, res: Response) => {
  try {
    const entrevistas = await prisma.entrevista.findMany();
    res.json(entrevistas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const entrevista = await prisma.entrevista.findUnique({
      where: {
        id_entrevista: Number(req.params.id) 
      },
      include: {
        tecnica_recoleccion: true,
        stakeholder: true,
        pregunta_entrevista: true
      }
    });
    if (!entrevista) return res.status(404).json({ error: 'Entrevista no encontrada' });
    res.json(entrevista);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear entrevista
router.post('/crear_entrevista/:id_subproceso', async (req: Request, res: Response) => {
  try {
    const { id_subproceso } = req.params;
    const { titulo, descripcion } = req.body;

    // 1. Crear técnica base
    const tecnicaRecoleccion = await prisma.tecnica_recoleccion.create({
      data: {
        id_tecnica_catalogo: Number(1),
        titulo: titulo,
        descripcion: descripcion,
        id_subproceso: Number(id_subproceso),
        estatus: "Planificada"
      }
    });

    // 2. Crear entrevista
    const entrevista = await prisma.entrevista.create({
      data: {
        id_tecnica: tecnicaRecoleccion.id_tecnica,
        fecha_entrevista: null,
        duracion: null,
      }
    });
    res.status(201).json({ tecnicaRecoleccion, entrevista });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar entrevista
router.put('/actualizar_entrevista/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fecha_entrevista, duracion, id_stakeholder, pregunta_entrevista, notas, id_tecnica, estatus } = req.body;

    const entrevista = await prisma.entrevista.update({
      where: {
        id_entrevista: Number(id)
      },
      data: {
        id_stakeholder: id_stakeholder && id_stakeholder !== 0
          ? Number(id_stakeholder) : null,
        fecha_entrevista: fecha_entrevista ? new Date(fecha_entrevista): null,
        duracion: Number(duracion),
        notas: notas,
      }
    });

    await prisma.tecnica_recoleccion.update({
      where: {
        id_tecnica: Number(id_tecnica)
      },
      data: {
        estatus: estatus,
        ultima_actualizacion: new Date()
      }
    });

    // Eliminar las preguntas anteriores
    await prisma.pregunta_entrevista.deleteMany({
      where: {
        id_entrevista: Number(id)
      }
    });

    // Crear las nuevas preguntas
    if (pregunta_entrevista.length > 0) {
      await prisma.pregunta_entrevista.createMany({
        data: pregunta_entrevista.map((p: any) => ({
          id_entrevista: Number(id),
          pregunta: p.pregunta,
          respuesta: p.respuesta
        }))
      });
    }

    res.json(entrevista);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar entrevista
router.delete('/eliminar_entrevista/:id', async (req: Request, res: Response) => {
  try {
    await prisma.entrevista.delete({
      where: { id_entrevista: Number(req.params.id) }
    });
    res.json({ message: 'Entrevista eliminada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;