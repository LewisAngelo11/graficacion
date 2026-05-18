import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { procesarDiagrama } from '../especificaciones/procesar-diagramas';
import { generarArchivosEstaticos } from '../especificaciones/generarSpecs';

const router = Router();

// Recopila datos generales del proyecto desde la BD

async function recopilarDatosGenerales(id_proyecto: number): Promise<string> {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id_proyecto },
    include: {
      rol: {
        include: {
          stakeholder: true
        }
      },
      proceso: {
        include: {
          subproceso: {
            include: {
              tecnica_recoleccion: {
                include: {
                  entrevista: { include: { pregunta_entrevista: true } },
                  cuestionario: {
                    include: {
                      pregunta_cuestionario: {
                        include: {
                          opcion_respuesta: true,
                          respuesta_cuestionario: true
                        }
                      }
                    }
                  },
                  observacion: { include: { observacion_detalle: true } },
                  focus_group: {
                    include: {
                      idea_generada: true,
                      participante_focus_group: { include: { stakeholder: true } }
                    }
                  },
                  historia_usuario: { include: { criterio_aceptacion: true } },
                  analisis_documento: {
                    include: { hallazgo_documento: true, requisito_documento: true }
                  },
                  seguimiento_transaccional: { include: { etapa_proceso: true } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!proyecto) throw new Error('Proyecto no encontrado');

  let contenido = `PROYECTO: ${proyecto.nombre ?? 'Sin nombre'}\n\nDESCRIPCIÓN: ${proyecto.descripcion ?? 'Sin descripción'}\n\n`;
  if (proyecto.problema_a_resolver) contenido += `PROBLEMA A RESOLVER: ${proyecto.problema_a_resolver}\n\n`;

  // Extraemos los roles y sus stakeholders asociados
  if (proyecto.rol && proyecto.rol.length > 0) {
    contenido += `INFORMACIÓN DEL PROYECTO (Roles y Stakeholders):\n`;
    for (const r of proyecto.rol) {
      contenido += `- Rol: ${r.nombre}\n`;
      
      if (r.stakeholder && r.stakeholder.length > 0) {
        for (const s of r.stakeholder) {
          contenido += `  * Stakeholder: ${s.nombre} (${s.area ?? 'Sin área'})\n`;
        }
      }
    }
    contenido += '\n';
  }

  for (const proceso of proyecto.proceso) {
    contenido += `PROCESO\nID: ${proceso.id_proceso}\nNombre: ${proceso.nombre}\nDescripción: ${proceso.descripcion ?? ''}\n\n`;
    contenido += `SUBPROCESOS ASOCIADOS AL PROCESO ${proceso.nombre} (ID: ${proceso.id_proceso})\n\n`;

    for (const sub of proceso.subproceso) {
      contenido += `ID: ${sub.id_subproceso}\nNombre: ${sub.nombre}\nDescripción: ${sub.descripcion ?? ''}\n\n`;

      for (const tecnica of sub.tecnica_recoleccion) {

        if (tecnica.entrevista.length > 0) {
          contenido += `ENTREVISTAS ASOCIADAS AL SUBPROCESO ${sub.nombre} (ID: ${sub.id_subproceso})\n\n`;
          for (const e of tecnica.entrevista) {
            contenido += `NOMBRE DE LA ENTREVISTA: ${tecnica.titulo}\nDESCRIPCIÓN: ${tecnica.descripcion ?? ''}\n`;
            if (e.notas) contenido += `NOTAS: ${e.notas}\n`;
            contenido += '\n';
            for (const p of e.pregunta_entrevista) {
              contenido += `Pregunta: ${p.pregunta}\nRespuesta: ${p.respuesta ?? 'Sin respuesta'}\n\n`;
            }
          }
        }

        if (tecnica.cuestionario.length > 0) {
          contenido += `CUESTIONARIOS ASOCIADOS AL SUBPROCESO ${sub.nombre} (ID: ${sub.id_subproceso})\n\n`;
          for (const c of tecnica.cuestionario) {
            contenido += `NOMBRE DEL CUESTIONARIO: ${tecnica.titulo} (ID: ${c.id_cuestionario})\nDESCRIPCIÓN: ${c.objetivo ?? ''}\n\n`;
            for (const p of c.pregunta_cuestionario) {
              contenido += `Pregunta: ${p.pregunta}\nTipo: ${p.tipo_pregunta}`;
              if (p.tipo_pregunta === 'escala') contenido += ` (${p.valor_minimo ?? 1}-${p.valor_maximo ?? 5})`;
              contenido += '\n';
              if (p.opcion_respuesta.length > 0) {
                for (const o of p.opcion_respuesta) contenido += `- ${o.texto_opcion}\n`;
              }
              if (p.respuesta_cuestionario.length > 0) {
                contenido += `Respuestas:\n`;
                for (const r of p.respuesta_cuestionario) {
                  contenido += `- ${r.respuesta_texto ?? r.respuesta_numero ?? 'Sin respuesta'}\n`;
                }
              }
              contenido += '\n';
            }
          }
        }

        if (tecnica.observacion.length > 0) {
          contenido += `OBSERVACIONES ASOCIADAS AL SUBPROCESO ${sub.nombre} (ID: ${sub.id_subproceso})\n\n`;
          for (const o of tecnica.observacion) {
            contenido += `NOMBRE: ${tecnica.titulo}\n`;
            if (o.ubicacion) contenido += `Ubicación: ${o.ubicacion}\n`;
            if (o.hallazgos) contenido += `Hallazgos: ${o.hallazgos}\n`;
            for (const d of o.observacion_detalle) {
              contenido += `- [${d.hora}] ${d.categoria}: ${d.descripcion ?? ''}\n`;
            }
            contenido += '\n';
          }
        }

        if (tecnica.focus_group.length > 0) {
          contenido += `FOCUS GROUPS ASOCIADOS AL SUBPROCESO ${sub.nombre} (ID: ${sub.id_subproceso})\n\n`;
          for (const f of tecnica.focus_group) {
            contenido += `Tema: ${f.tema}\n`;
            if (f.conclusiones) contenido += `Conclusiones: ${f.conclusiones}\n`;
            for (const p of f.participante_focus_group) {
              contenido += `- ${p.stakeholder?.nombre ?? 'Desconocido'} (${p.stakeholder?.area ?? 'Sin área'})\n`;
            }
            for (const i of f.idea_generada) {
              contenido += `Idea: ${i.idea ?? ''}${i.puntucacion ? ` (${i.puntucacion} pts)` : ''}\n`;
            }
            contenido += '\n';
          }
        }

        if (tecnica.historia_usuario.length > 0) {
          contenido += `HISTORIAS DE USUARIO ASOCIADAS AL SUBPROCESO ${sub.nombre} (ID: ${sub.id_subproceso})\n`;
          for (const h of tecnica.historia_usuario) {
            contenido += `Rol: ${h.autor}\nNecesidad: ${h.objetivo}\nBeneficio: ${h.proposito}\n`;
            for (const c of h.criterio_aceptacion) contenido += `- ${c.descripcion}\n`;
            contenido += '\n';
          }
        }

        if (tecnica.analisis_documento.length > 0) {
          contenido += `ANÁLISIS DE DOCUMENTOS ASOCIADOS AL SUBPROCESO ${sub.nombre} (ID: ${sub.id_subproceso})\n`;
          for (const a of tecnica.analisis_documento) {
            contenido += `Documento: ${a.nombre_documento}\nTipo: ${a.tipo_documento ?? ''}\nFuente: ${a.fuente ?? ''}\n`;
            for (const h of a.hallazgo_documento) contenido += `Hallazgo: ${h.descripcion}\n`;
            for (const r of a.requisito_documento) contenido += `Requisito [${r.tipo_requisito ?? 'General'}]: ${r.descripcion}\n`;
            contenido += '\n';
          }
        }

        if (tecnica.seguimiento_transaccional.length > 0) {
          contenido += `SEGUIMIENTOS TRANSACCIONALES ASOCIADOS AL SUBPROCESO ${sub.nombre} (ID: ${sub.id_subproceso})\n`;
          for (const s of tecnica.seguimiento_transaccional) {
            contenido += `Flujo: ${s.descripcion_flujo}\n`;
            for (const e of s.etapa_proceso) {
              contenido += `- ${e.nombre_etapa}: ${e.descripcion ?? ''}\n`;
              if (e.entradas) contenido += `  Entradas: ${e.entradas}\n`;
              if (e.salidas) contenido += `  Salidas: ${e.salidas}\n`;
              if (e.mejora_propuesta) contenido += `  Mejora: ${e.mejora_propuesta}\n`;
            }
            contenido += '\n';
          }
        }
      }
    }
  }

  return contenido;
}

// Recopila diagramas del proyecto desde la BD

async function recopilarDiagramas(id_proyecto: number): Promise<string> {
  const proyecto = await prisma.proyecto.findUnique({ where: { id_proyecto } });
  const diagramas = await prisma.diagrama_uml.findMany({
    where: { id_proyecto, estatus: 'A' }
  });

  if (diagramas.length === 0) return 'No hay diagramas registrados para este proyecto.\n';

  let contenido = `DIAGRAMAS DEL PROYECTO ${proyecto?.nombre ?? ''}\n\n`;
  for (const d of diagramas) {
    contenido += `Nombre del diagrama: ${d.nombre}\nTipo de diagrama: ${d.tipo_diagrama ?? 'Sin tipo'}\n\n`;
    if (d.diagrama) contenido += procesarDiagrama(d.tipo_diagrama ?? '', d.diagrama);
    contenido += '\n';
  }
  return contenido;
}

// Devuelve resumen para mostrar en el modal del frontend

router.get('/:id_proyecto/preview', async (req: Request, res: Response) => {
  try {
    const id_proyecto = Number(req.params.id_proyecto);

    const [datosGenerales, diagramas] = await Promise.all([
      recopilarDatosGenerales(id_proyecto),
      recopilarDiagramas(id_proyecto)
    ]);

    res.json({
      datos_generales: datosGenerales,
      diagramas
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Recopila datos, genera archivos y los guarda en Downloads

router.post('/:id_proyecto/generar', async (req: Request, res: Response) => {
  try {
    const id_proyecto = Number(req.params.id_proyecto);

    const proyecto = await prisma.proyecto.findUnique({ where: { id_proyecto } });
    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const [datosGenerales, diagramas] = await Promise.all([
      recopilarDatosGenerales(id_proyecto),
      recopilarDiagramas(id_proyecto)
    ]);

    // Genera carpeta con todos los archivos en Downloads/lava plus
    const rutaCarpeta = await generarArchivosEstaticos(
      'lava plus',
      datosGenerales,
      diagramas
    );

    res.json({
      mensaje: `Archivos generados correctamente en ${rutaCarpeta}`,
      ruta: rutaCarpeta
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;