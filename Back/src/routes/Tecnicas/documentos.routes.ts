import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';

const router = Router();

// Crear tecnica de documentos (análisis de documentos)
router.post('/:id_subproceso', async (req: Request, res: Response) => {
  try {
    const { id_subproceso } = req.params;
    const { titulo, descripcion } = req.body;

    // Crea la técnica base
    const tecnicaRecoleccion = await prisma.tecnica_recoleccion.create({
      data: {
        id_tecnica_catalogo: Number(5),
        titulo: titulo,
        descripcion: descripcion,
        id_subproceso: Number(id_subproceso),
        estatus: "Planificada",
      }
    });

    // Crea el analisis de documento en automático
    const analisisDocumento = await prisma.analisis_documento.create({
      data: {
        id_tecnica: Number(tecnicaRecoleccion.id_tecnica),
        nombre_documento: titulo // Por defecto usamos el titulo
      }
    });

    res.status(201).json({ tecnicaRecoleccion, analisisDocumento });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Todos los analisis de documentos
router.get('/', async (req: Request, res: Response) => {
  try {
    const documentos = await prisma.analisis_documento.findMany({
      include: { tecnica_recoleccion: true }
    });
    res.json(documentos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener documento por su id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const documento = await prisma.analisis_documento.findUnique({
      where: { id_analisis_documento: Number(req.params.id) },
      include: { tecnica_recoleccion: true, hallazgo_documento: true, requisito_documento: true }
    });
    if (!documento) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json(documento);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar documento (info general + hallazgos + requisitos)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre_documento, tipo_documento, fuente, fecha_analisis, estatus, observaciones, hallazgos, requisitos } = req.body;

    // Actualizar información general del documento
    await prisma.analisis_documento.update({
      where: { id_analisis_documento: Number(id) },
      data: {
        ...(nombre_documento !== undefined && { nombre_documento }),
        ...(tipo_documento !== undefined && { tipo_documento }),
        ...(fuente !== undefined && { fuente }),
        ...(fecha_analisis && { fecha_analisis: new Date(fecha_analisis) }),
        ...(estatus !== undefined && { estatus }),
        ...(observaciones !== undefined && { observaciones })
      }
    });

    // Actualizar hallazgos (delete old + create new)
    if (hallazgos !== undefined) {
      await prisma.hallazgo_documento.deleteMany({
        where: { id_analisis_documento: Number(id) }
      });

      if (hallazgos.length > 0) {
        await prisma.hallazgo_documento.createMany({
          data: hallazgos.map((h: any) => ({
            id_analisis_documento: Number(id),
            descripcion: h.texto,
            pagina: h.pagina ? Number(h.pagina) : null
          }))
        });
      }
    }

    // Actualizar requisitos (delete old + create new)
    if (requisitos !== undefined) {
      await prisma.requisito_documento.deleteMany({
        where: { id_analisis_documento: Number(id) }
      });

      if (requisitos.length > 0) {
        await prisma.requisito_documento.createMany({
          data: requisitos.map((r: any) => ({
            id_analisis_documento: Number(id),
            descripcion: r.texto,
            tipo_requisito: r.tipo || null
          }))
        });
      }
    }

    // Devolver el documento actualizado con todas sus relaciones
    const documentoActualizado = await prisma.analisis_documento.findUnique({
      where: { id_analisis_documento: Number(id) },
      include: {
        hallazgo_documento: true,
        requisito_documento: true
      }
    });

    res.json(documentoActualizado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
