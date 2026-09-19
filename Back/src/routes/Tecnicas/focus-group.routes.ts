import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';

const router = Router();

// Crear tecnica de focus group
router.post('/:id_subproceso', async (req: Request, res: Response) => {
  try {
    const { id_subproceso } = req.params;
    const { titulo, descripcion } = req.body;

    // Crea la técnica base
    const tecnicaRecoleccion = await prisma.tecnica_recoleccion.create({
      data: {
        id_tecnica_catalogo: Number(3),
        titulo: titulo,
        descripcion: descripcion,
        id_subproceso: Number(id_subproceso),
        estatus: "Planificada"
      }
    });

    // Crea el focus group en automático
    const focusGroup = await prisma.focus_group.create({
      data: {
        id_tecnica: Number(tecnicaRecoleccion.id_tecnica),
        tema: titulo // Por defecto asignamos el título como tema
      }
    });

    res.status(201).json({ tecnicaRecoleccion, focusGroup });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Todas los focus groups
router.get('/', async (req: Request, res: Response) => {
  try {
    const focusGroups = await prisma.focus_group.findMany({
      include: { tecnica_recoleccion: true }
    });
    res.json(focusGroups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener focus group por su id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const focusGroup = await prisma.focus_group.findUnique({
      where: { id_focus: Number(req.params.id) },
      include: {
        tecnica_recoleccion: true,
        idea_generada: true,
        participante_focus_group: {
          include: {
            stakeholder: true
          }
        }
      }
    });
    if (!focusGroup) return res.status(404).json({ error: 'Focus Group no encontrado' });
    res.json(focusGroup);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar focus group
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fecha, duracion, estatus, tema, conclusiones, participantes, ideas } = req.body;

    // Actualizar los campos básicos del focus group
    const focusGroup = await prisma.focus_group.update({
      where: {
        id_focus: Number(id)
      },
      data: {
        ...(fecha && { fecha: new Date(fecha) }),
        ...(duracion !== undefined && { duracion: Number(duracion) }),
        ...(estatus && { estatus }),
        ...(tema !== undefined && { tema }),
        ...(conclusiones !== undefined && { conclusiones })
      }
    });

    // Actualizar participantes (delete old + create new)
    if (participantes !== undefined) {
      await prisma.participante_focus_group.deleteMany({
        where: { id_focus: Number(id) }
      });

      if (participantes.length > 0) {
        const participantesValidos = participantes.filter((p: any) => p.stakeholder);
        if (participantesValidos.length > 0) {
          await prisma.participante_focus_group.createMany({
            data: participantesValidos.map((p: any) => ({
              id_focus: Number(id),
              id_stakeholder: Number(p.stakeholder)
            }))
          });
        }
      }
    }

    // Actualizar ideas generadas (delete old + create new)
    if (ideas !== undefined) {
      await prisma.idea_generada.deleteMany({
        where: { id_focus: Number(id) }
      });

      if (ideas.length > 0) {
        await prisma.idea_generada.createMany({
          data: ideas.map((i: any) => ({
            id_focus: Number(id),
            idea: i.texto,
            puntucacion: Number(i.votos) || 0
          }))
        });
      }
    }

    // Retornar el focus group actualizado con sus relaciones
    const focusGroupActualizado = await prisma.focus_group.findUnique({
      where: { id_focus: Number(id) },
      include: {
        idea_generada: true,
        participante_focus_group: {
          include: { stakeholder: true }
        }
      }
    });

    res.json(focusGroupActualizado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar focus group (opcional, la tecnica en cascada ya lo hace, pero por si acaso)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.focus_group.delete({
      where: { id_focus: Number(req.params.id) }
    });
    res.json({ message: 'Focus group eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
