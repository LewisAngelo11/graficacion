import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';

const router = Router();

// Obtener todas las historias de usuario
router.get('/', async (req: Request, res: Response) => {
  try {
    const historias = await prisma.historia_usuario.findMany({
      include: {
        criterio_aceptacion: true
      }
    });
    res.json(historias);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una historia de usuario por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const historia = await prisma.historia_usuario.findUnique({
      where: { id_historia_usario: Number(req.params.id) },
      include: {
        criterio_aceptacion: true
      }
    });
    if (!historia) return res.status(404).json({ error: 'Historia de usuario no encontrada' });
    res.json(historia);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear historia de usuario (crea la tecnica base y la historia)
router.post('/crear_historia/:id_subproceso', async (req: Request, res: Response) => {
  try {
    const { id_subproceso } = req.params;
    const { titulo, descripcion, autor, objetivo, proposito, criterios } = req.body;

    // 1. Crear la técnica base
    const tecnicaRecoleccion = await prisma.tecnica_recoleccion.create({
      data: {
        id_tecnica_catalogo: Number(6),
        titulo: titulo,
        descripcion: descripcion,
        id_subproceso: Number(id_subproceso),
        estatus: "Planificada"
      }
    });

    // 2. Crear la historia de usuario
    const historia = await prisma.historia_usuario.create({
      data: {
        titulo: titulo,
        autor: autor || "",
        objetivo: objetivo || "",
        proposito: proposito || "",
        id_tecnica: tecnicaRecoleccion.id_tecnica,
        criterio_aceptacion: criterios && criterios.length > 0 && {
          create: criterios.map((criterio: any) => ({
            descripcion: criterio.descripcion
          }))
        }
      },
      include: {
        criterio_aceptacion: true
      }
    });
    res.status(201).json({ tecnicaRecoleccion, historia });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar historia de usuario
router.put('/actualizar_historia/:id', async (req: Request, res: Response) => {
  try {
    const { titulo, autor, objetivo, proposito, id_tecnica, criterios_aceptacion, estatus } = req.body;
    console.log(req.body);
    const historia = await prisma.historia_usuario.update({
      where: { id_historia_usario: Number(req.params.id) },
      data: {
        ...(titulo && { titulo }),
        ...(autor && { autor }),
        ...(objetivo && { objetivo }),
        ...(proposito && { proposito }),
        ...(id_tecnica !== undefined && { id_tecnica })
      }
    });

    console.log(estatus);
    await prisma.tecnica_recoleccion.update({
      where: {
        id_tecnica: Number(id_tecnica)
      },
      data: {
        estatus: estatus,
        ultima_actualizacion: new Date()
      }
    });

    if (criterios_aceptacion !== undefined) {
      // Eliminar criterios anteriores
      await prisma.criterio_aceptacion.deleteMany({
        where: { id_historia_usario: Number(req.params.id) }
      });

      // Crear nuevos criterios
      if (criterios_aceptacion.length > 0) {
        await prisma.criterio_aceptacion.createMany({
          data: criterios_aceptacion.map((c: any) => ({
            id_historia_usario: Number(req.params.id),
            descripcion: c.texto || c.descripcion
          }))
        });
      }
    }

    res.json(historia);
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

// Eliminar historia de usuario
router.delete('/eliminar_historia/:id', async (req: Request, res: Response) => {
  try {
    // Primero eliminar criterios de aceptación asociados por la llave foránea
    await prisma.criterio_aceptacion.deleteMany({
      where: { id_historia_usario: Number(req.params.id) }
    });

    await prisma.historia_usuario.delete({
      where: { id_historia_usario: Number(req.params.id) }
    });

    res.json({ message: 'Historia de usuario y sus criterios eliminados exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los criterios de una historia de usuario
router.get('/:id/criterios', async (req: Request, res: Response) => {
  try {
    const criterios = await prisma.criterio_aceptacion.findMany({
      where: { id_historia_usario: Number(req.params.id) }
    });
    res.json(criterios);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un nuevo criterio de aceptación para una historia existente
router.post('/crear_criterio', async (req: Request, res: Response) => {
  try {
    const { descripcion, id_historia_usario } = req.body;
    const criterio = await prisma.criterio_aceptacion.create({
      data: {
        descripcion,
        id_historia_usario
      }
    });
    res.status(201).json(criterio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar criterio de aceptación
router.put('/actualizar_criterio/:id', async (req: Request, res: Response) => {
  try {
    const { descripcion } = req.body;
    const criterio = await prisma.criterio_aceptacion.update({
      where: { id_criterio: Number(req.params.id) },
      data: {
        ...(descripcion && { descripcion })
      }
    });
    res.json(criterio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar criterio de aceptación
router.delete('/eliminar_criterio/:id', async (req: Request, res: Response) => {
  try {
    await prisma.criterio_aceptacion.delete({
      where: { id_criterio: Number(req.params.id) }
    });
    res.json({ message: 'Criterio de aceptación eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
