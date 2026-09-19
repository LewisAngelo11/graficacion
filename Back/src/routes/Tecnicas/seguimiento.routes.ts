import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';

const router = Router();

// Crear tecnica de seguimiento transaccional
router.post('/:id_subproceso', async (req: Request, res: Response) => {
  try {
    const { id_subproceso } = req.params;
    const { titulo, descripcion } = req.body;

    // Crea la técnica base
    const tecnicaRecoleccion = await prisma.tecnica_recoleccion.create({
      data: {
        id_tecnica_catalogo: Number(7), // 7 = Seguimiento Transaccional
        titulo: titulo,
        descripcion: descripcion,
        id_subproceso: Number(id_subproceso),
        estatus: "Planificada"
      }
    });

    // Crea el seguimiento transaccional en automático
    const seguimiento = await prisma.seguimiento_transaccional.create({
      data: {
        id_tecnica: Number(tecnicaRecoleccion.id_tecnica),
        descripcion_flujo: descripcion || titulo // Requerido por la BD
      }
    });

    res.status(201).json({ tecnicaRecoleccion, seguimiento });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Todos los seguimientos
router.get('/', async (req: Request, res: Response) => {
  try {
    const seguimientos = await prisma.seguimiento_transaccional.findMany({
      include: { tecnica_recoleccion: true }
    });
    res.json(seguimientos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener seguimiento por su id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const seguimiento = await prisma.seguimiento_transaccional.findUnique({
      where: { id_seguimiento: Number(req.params.id) },
      include: { 
        tecnica_recoleccion: true, 
        etapa_proceso: {
          orderBy: { id_etapa: 'asc' }
        }
      }
    });
    if (!seguimiento) return res.status(404).json({ error: 'Seguimiento no encontrado' });
    res.json(seguimiento);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar seguimiento
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { descripcion_flujo, etapas } = req.body;

    console.log(etapas);

    const seguimiento = await prisma.seguimiento_transaccional.update({
      where: {
        id_seguimiento: Number(id)
      },
      data: {
        ...(descripcion_flujo !== undefined && { descripcion_flujo })
      }
    });

    if (etapas && Array.isArray(etapas)) {
      // Eliminar etapas anteriores
      await prisma.etapa_proceso.deleteMany({
        where: { id_seguimiento: Number(id) }
      });

      // Crear nuevas etapas
      if (etapas.length > 0) {
        await prisma.etapa_proceso.createMany({
          data: etapas.map((e: any) => ({
            id_seguimiento: Number(id),
            id_rol: Number(e.id_rol),
            nombre_etapa: e.nombre || "",
            descripcion: e.descripcion || "",
            entradas: e.entradas || "",
            salidas: e.salidas || "",
            cuello_botella: e.cuello_botella || "",
            mejora_propuesta: e.mejora_propuesta || ""
          }))
        });
      }
    }

    const updated = await prisma.seguimiento_transaccional.findUnique({
      where: { id_seguimiento: Number(id) },
      include: { etapa_proceso: true }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
