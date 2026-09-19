import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';

const router = Router();

// Crear tecnica de cuestionario
router.post('/:id_subproceso', async (req: Request, res: Response) => {
  try {
    const { id_subproceso } = req.params;
    const { titulo, descripcion } = req.body;

    // Crea la técnica base
    const tecnicaRecoleccion = await prisma.tecnica_recoleccion.create({
      data: {
        id_tecnica_catalogo: Number(4),
        titulo: titulo,
        descripcion: descripcion,
        id_subproceso: Number(id_subproceso),
        estatus: "Planificada"
      }
    });

    // Crea el cuestionario en automático
    const cuestionario = await prisma.cuestionario.create({
      data: {
        id_tecnica: Number(tecnicaRecoleccion.id_tecnica)
      }
    });

    res.status(201).json({ tecnicaRecoleccion, cuestionario });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Todas los cuestionarios
router.get('/', async (req: Request, res: Response) => {
  try {
    const cuestionarios = await prisma.cuestionario.findMany({
      include: { tecnica_recoleccion: true }
    });
    res.json(cuestionarios);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener cuestionario por su id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cuestionario = await prisma.cuestionario.findUnique({
      where: { id_cuestionario: Number(req.params.id) },
      include: {
        tecnica_recoleccion: true,
        respuesta_cuestionario: true,
        pregunta_cuestionario: {
          orderBy: { orden_pregunta: 'asc' },
          include: {
            opcion_respuesta: true,
            respuesta_cuestionario: true,
          }
        }
      }
    });
    if (!cuestionario) return res.status(404).json({ error: 'Cuestionario no encontrado' });
    res.json(cuestionario);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar cuestionario (info general + preguntas con sus opciones)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      objetivo, audiencia_objetivo, responsable, metodo_distribucion,
      fecha_distribucion, fecha_limite, respuestas_recibidas,
      instrucciones, preguntas
    } = req.body;

    const mapTipoPregunta = (tipo: string): any => {
      if (tipo === "Opción Múltiple") return "opcion_multiple";
      if (tipo === "Escala") return "escala";
      return "texto_libre";
    };

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar información general del cuestionario
      const cuestionarioActualizado = await tx.cuestionario.update({
        where: { id_cuestionario: Number(id) },
        data: {
          objetivo: objetivo,
          audiencia_objetivo: audiencia_objetivo,
          responsable: responsable,
          metodo_distribucion: metodo_distribucion,
          fecha_distribucion: fecha_distribucion ? new Date(fecha_distribucion) : null,
          fecha_limite: fecha_limite ? new Date(fecha_limite) : null,
          respuestas_recibidas: Number(respuestas_recibidas) || 0,
          instrucciones: instrucciones
        }
      });

      // 2. Obtener preguntas existentes para conciliación
      const preguntasExistentes = await tx.pregunta_cuestionario.findMany({
        where: { id_cuestionario: Number(id) },
        include: { opcion_respuesta: true }
      });

      const idsPreguntasRecibidas = preguntas.map((p: any) => p.id_pregunta).filter((id: any) => id != null);

      // 3. Eliminar preguntas que no están en el body
      await tx.pregunta_cuestionario.deleteMany({
        where: {
          id_cuestionario: Number(id),
          id_pregunta: { notIn: idsPreguntasRecibidas }
        }
      });

      // 4. Crear o actualizar preguntas
      if (preguntas && preguntas.length > 0) {
        for (let i = 0; i < preguntas.length; i++) {
          const p = preguntas[i];
          const preguntaExistente = preguntasExistentes.find(pe => pe.id_pregunta === p.id_pregunta);

          if (preguntaExistente) {
            // Actualizar pregunta existente
            await tx.pregunta_cuestionario.update({
              where: { id_pregunta: p.id_pregunta },
              data: {
                orden_pregunta: i + 1,
                pregunta: p.textoPregunta,
                tipo_pregunta: mapTipoPregunta(p.tipo),
                valor_minimo: p.escalaMin != null ? Number(p.escalaMin) : null,
                valor_maximo: p.escalaMax != null ? Number(p.escalaMax) : null,
                etiqueta_minima: p.etiquetaMin || null,
                etiqueta_maxima: p.etiquetaMax || null
              }
            });

            // Conciliar opciones de la pregunta
            const idsOpcionesRecibidas = (p.opciones || []).map((o: any) => o.id_opcion).filter((id: any) => id != null);

            // Eliminar opciones que ya no están
            await tx.opcion_respuesta.deleteMany({
              where: {
                id_pregunta: p.id_pregunta,
                id_opcion: { notIn: idsOpcionesRecibidas }
              }
            });

            // Crear o actualizar opciones
            if (p.opciones && p.opciones.length > 0) {
              for (const op of p.opciones) {
                const opcionExistente = preguntaExistente.opcion_respuesta.find(oe => oe.id_opcion === op.id_opcion);
                if (opcionExistente) {
                  await tx.opcion_respuesta.update({
                    where: { id_opcion: op.id_opcion },
                    data: { texto_opcion: op.texto }
                  });
                } else {
                  await tx.opcion_respuesta.create({
                    data: {
                      id_pregunta: p.id_pregunta,
                      texto_opcion: op.texto
                    }
                  });
                }
              }
            }

          } else {
            // Crear nueva pregunta
            const nuevaPregunta = await tx.pregunta_cuestionario.create({
              data: {
                id_cuestionario: Number(id),
                orden_pregunta: i + 1,
                pregunta: p.textoPregunta,
                tipo_pregunta: mapTipoPregunta(p.tipo),
                valor_minimo: p.escalaMin != null ? Number(p.escalaMin) : null,
                valor_maximo: p.escalaMax != null ? Number(p.escalaMax) : null,
                etiqueta_minima: p.etiquetaMin || null,
                etiqueta_maxima: p.etiquetaMax || null
              }
            });

            // Crear opciones para la nueva pregunta
            if (p.tipo === "Opción Múltiple" && p.opciones && p.opciones.length > 0) {
              for (const op of p.opciones) {
                await tx.opcion_respuesta.create({
                  data: {
                    id_pregunta: nuevaPregunta.id_pregunta,
                    texto_opcion: op.texto
                  }
                });
              }
            }
          }
        }
      }

      return cuestionarioActualizado;
    });

    res.json(resultado);
  } catch (error: any) {
    console.error("Error al actualizar cuestionario:", error);
    res.status(400).json({ error: error.message });
  }
});

// Método para guardar las respuestas del cuestionario
router.post('/:id/responder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { respuestas } = req.body;

    await prisma.$transaction(async (tx) => {
      // 1. Eliminar respuestas anteriores para este cuestionario
      // (Se eliminan todas para mantener el estado actual de "respuestas enviadas")
      await tx.respuesta_cuestionario.deleteMany({
        where: { id_cuestionario: Number(id) }
      });

      // 2. Crear las nuevas respuestas
      if (respuestas && respuestas.length > 0) {
        for (const r of respuestas) {
          await tx.respuesta_cuestionario.create({
            data: {
              id_cuestionario: Number(id),
              id_pregunta: Number(r.id_pregunta),
              id_opcion: r.id_opcion ? Number(r.id_opcion) : null,
              respuesta_texto: r.respuesta_texto || null,
              respuesta_numero: r.respuesta_numero != null ? Number(r.respuesta_numero) : null
            }
          });
        }
      }
    });

    res.json({ message: 'Respuestas registradas exitosamente' });
  } catch (error: any) {
    console.error("Error al guardar respuestas:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
