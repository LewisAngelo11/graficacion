// Convierte JSON de ReactFlow a texto estructurado (Mermaid.js) legible para agentes de IA
interface Nodo {
  id: string;
  type: string;
  data: any;
  groupId?: string;
  parentNode?: string;
  points?: { x: number; y: number }[];
}

interface Arista {
  source: string;
  target: string;
  data?: { 
    label?: string; 
    mensaje?: string;
    multiplicidadOrigen?: string;
    multiplicidadDestino?: string;
    tipoRelacion?: string;
    dashed?: boolean;
    [key: string]: any; 
  };
  points?: { x: number; y: number }[];
}

interface Diagrama {
  nodes: Nodo[];
  edges: Arista[];
}

function aCamelCase(texto: string): string {
  if (!texto) return '';
  
  // Limpiamos y usamos .filter(Boolean) para eliminar strings vacíos del array
  const palabras = texto.trim().replace(/[^a-zA-Z0-9 a-zA-ZÀ-ÿ]/g, '').split(/\s+/).filter(Boolean);
  
  const primeraPalabra = palabras[0];
  
  // Validación estricta para TypeScript: si no hay palabras, retornamos vacío
  if (!primeraPalabra) return ''; 

  // Si solo hay una palabra, ya sabemos con seguridad que 'primeraPalabra' existe
  if (palabras.length === 1) return primeraPalabra.toLowerCase();
  
  return primeraPalabra.toLowerCase() + palabras.slice(1).map(p => 
    p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  ).join('');
}

// Formateador hiper-explícito para el agente
function formatearMiembroEstricto(item: any): string {
  let nombreCrudo = '';
  let esMetodo = false;
  let tipo = '';
  let visibilidad = '+'; 

  if (typeof item === 'string') {
    nombreCrudo = item;
    esMetodo = nombreCrudo.includes('()');
    nombreCrudo = nombreCrudo.replace('()', '');
  } else if (item && typeof item === 'object') {
    nombreCrudo = item.nombre || item.name || item.texto || 'sinNombre';
    esMetodo = item.esMetodo || nombreCrudo.includes('()');
    tipo = item.tipo || item.type || '';
    visibilidad = item.visibilidad || item.visibility || '+';
    nombreCrudo = nombreCrudo.replace('()', '');
  }

  // Sanitizamos el nombre
  const nombreLimpio = aCamelCase(nombreCrudo);
  
  if (esMetodo) {
    const retorno = tipo ? tipo : 'void'; // Fuerza un retorno si no existe
    return `${visibilidad}${nombreLimpio}() ${retorno}`;
  } else {
    const tipoDato = tipo ? tipo : 'String'; // Fuerza un tipo de dato por defecto
    return `${visibilidad}${tipoDato} ${nombreLimpio}`;
  }
}

// Extrae texto de arreglos y aplica el formateador estricto
function extraerLista(lista: any): string[] {
  if (!Array.isArray(lista)) return [];
  return lista.map(formatearMiembroEstricto);
}

function obtenerNombreNodo(nodo: Nodo): string {
  if (!nodo || !nodo.data) return nodo?.id || 'Desconocido';
  
  const nombreDirecto = nodo.data.nombrePaquete 
      || nodo.data.nombreParticipante 
      || nodo.data.textoActor 
      || nodo.data.textoCasoUso
      || nodo.data.nombre 
      || nodo.data.label 
      || nodo.data.text 
      || nodo.data.texto 
      || nodo.data.title;
      
  if (nombreDirecto && typeof nombreDirecto === 'string' && nombreDirecto.trim() !== '') {
      if (nodo.data.title && nodo.data.label) {
          return `${nodo.data.title} - ${nodo.data.label}`;
      }
      return nombreDirecto;
  }

  const valoresString = Object.values(nodo.data).filter(v => typeof v === 'string' && v.trim() !== '');
  if (valoresString.length > 0) {
      return valoresString.join(' | '); 
  }

  return nodo.id;
}


// PROCESADORES DE DIAGRAMAS

function procesarDiagramaClase(diagrama: Diagrama): string {
  const { nodes: nodos, edges: aristas } = diagrama;
  let contenido = 'classDiagram\n'; 
  const mapaNodos = new Map<string, Nodo>();

  for (const nodo of nodos) mapaNodos.set(nodo.id, nodo);

  for (const nodo of nodos) {
    const { type, data } = nodo;
    const typeLower = type.toLowerCase();
    
    if (!typeLower.includes('clas') && !typeLower.includes('interfa') && !typeLower.includes('enum')) continue;

    const nombre = (data.nombre || data.label || 'EntidadDesconocida').replace(/\s+/g, '');

    if (typeLower.includes('interfa')) contenido += `  class ${nombre} {\n    <<interface>>\n  }\n`;
    else if (typeLower.includes('enum')) contenido += `  class ${nombre} {\n    <<enumeration>>\n  }\n`;

    contenido += `  class ${nombre} {\n`;

    const atributos = extraerLista(data.atributos || data.attributes || data.propiedades || []);
    for (const atributo of atributos) contenido += `    ${atributo}\n`;

    const metodos = extraerLista(data.metodos || data.methods || data.operaciones || []);
    for (const metodo of metodos) contenido += `    ${metodo}\n`;

    contenido += `  }\n\n`;
  }

  if (aristas.length > 0) {
    for (const rel of aristas) {
      const origen = mapaNodos.get(rel.source);
      const destino = mapaNodos.get(rel.target);
      if (!origen || !destino) continue;
      
      const nombreOrigen = (origen.data?.nombre || origen.data?.label || 'Origen').replace(/\s+/g, '');
      const nombreDestino = (destino.data?.nombre || destino.data?.label || 'Destino').replace(/\s+/g, '');
      
      const multOrigen = rel.data?.multiplicidadOrigen || rel.data?.sourceLabel ? `"${rel.data?.multiplicidadOrigen || rel.data?.sourceLabel}" ` : '"1" ';
      const multDestino = rel.data?.multiplicidadDestino || rel.data?.targetLabel ? ` "${rel.data?.multiplicidadDestino || rel.data?.targetLabel}"` : ' "1..*"';
      const tipoFlecha = rel.data?.tipoRelacion || '-->'; 
      const etiqueta = rel.data?.label || rel.data?.mensaje ? ` : ${rel.data.label || rel.data.mensaje}` : ' : se_relaciona';
      
      contenido += `  ${nombreOrigen} ${multOrigen}${tipoFlecha}${multDestino} ${nombreDestino}${etiqueta}\n`;
    }
  }
  return contenido;
}

function procesarDiagramaCasosUso(diagrama: Diagrama): string {
  const { nodes: nodos, edges: aristas } = diagrama;
  let contenido = 'flowchart LR\n\n'; 
  const mapaNodos = new Map<string, Nodo>();

  for (const nodo of nodos) mapaNodos.set(nodo.id, nodo);

  const boundary = nodos.find(n => n.type.toLowerCase().includes('boundary') || n.type.toLowerCase().includes('sistema'));
  const actores = nodos.filter(n => n.type.toLowerCase().includes('actor'));
  const casosUso = nodos.filter(n => 
      !n.type.toLowerCase().includes('actor') && 
      !n.type.toLowerCase().includes('boundary') &&
      !n.type.toLowerCase().includes('sistema')
  );

  if (actores.length > 0) {
    for (const actor of actores) {
       const id = actor.id.replace(/-/g, '_'); 
       const nombre = obtenerNombreNodo(actor);
       contenido += `  ${id}(([${nombre}]))\n`; 
    }
    contenido += '\n';
  }

  if (boundary) {
    contenido += `  subgraph Sistema [${obtenerNombreNodo(boundary)}]\n`;
    contenido += `    direction TB\n`;
  }

  if (casosUso.length > 0) {
    for (const caso of casosUso) {
       const id = caso.id.replace(/-/g, '_');
       const nombre = obtenerNombreNodo(caso);
       contenido += `    ${id}([${nombre}])\n`; 
    }
  }

  if (boundary) contenido += `  end\n\n`; 

  if (aristas.length > 0) {
    for (const arista of aristas) {
      const idOrigen = arista.source.replace(/-/g, '_');
      const idDestino = arista.target.replace(/-/g, '_');
      const relacion = arista.data?.label || arista.data?.tipoRelacion || 'ejecuta';
      
      const flecha = relacion.includes('include') || relacion.includes('extend') ? '-.->' : '-->';
      
      contenido += `  ${idOrigen} ${flecha}|${relacion}| ${idDestino}\n`;
    }
  }
  return contenido + '\n';
}

function procesarDiagramaPaquetes(diagrama: Diagrama): string {
  const { nodes: nodos, edges: aristas } = diagrama;
  let contenido = 'flowchart TB\n\n'; 
  
  const cleanId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '_');
  const getPadreId = (nodo: Nodo) => nodo.parentNode || nodo.groupId;

  const paquetes = nodos.filter(n => n.type.toLowerCase().includes('paquet') || n.type.toLowerCase().includes('package'));
  const paquetesRaiz = paquetes.filter(p => !getPadreId(p)); 

  function renderizarPaquete(paquete: Nodo, nivel: number) {
    const indent = '  '.repeat(nivel + 1);
    const id = cleanId(paquete.id);
    const nombre = obtenerNombreNodo(paquete).replace(/"/g, "'"); 
    
    const hijos = paquetes.filter(p => getPadreId(p) === paquete.id);
    
    if (hijos.length > 0) {
      contenido += `${indent}subgraph ${id} ["📦 ${nombre}"]\n`;
      contenido += `${indent}  direction TB\n`;
      for (const hijo of hijos) {
        renderizarPaquete(hijo, nivel + 1);
      }
      contenido += `${indent}end\n`;
    } else {
      contenido += `${indent}${id}["📁 ${nombre}"]\n`;
    }
  }

  for (const raiz of paquetesRaiz) {
    renderizarPaquete(raiz, 0);
  }
  contenido += '\n';

  if (aristas.length > 0) {
    for (const arista of aristas) {
      const idOrigen = cleanId(arista.source);
      const idDestino = cleanId(arista.target);
      
      const etiqueta = arista.data?.label || arista.data?.mensaje ? `|"${arista.data.label || arista.data.mensaje}"|` : '';
      const flecha = arista.data?.dashed !== false ? '-.->' : '-->'; 
      
      contenido += `  ${idOrigen} ${flecha}${etiqueta} ${idDestino}\n`;
    }
  }

  return contenido;
}

function procesarDiagramaSecuencia(diagrama: Diagrama): string {
  const { nodes: nodos, edges: aristas } = diagrama;
  let contenido = 'sequenceDiagram\n';
  
  const cleanId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '_');
  const mapaNombres = new Map<string, string>();

  const participantes = nodos.filter(n => 
    !n.type.toLowerCase().includes('activacion') && 
    !n.type.toLowerCase().includes('activation')
  );
  
  for (const p of participantes) {
    const nombre = obtenerNombreNodo(p).replace(/"/g, "'");
    const idLocal = cleanId(p.id);
    mapaNombres.set(p.id, idLocal);
    
    const keyword = p.type.toLowerCase().includes('actor') ? 'actor' : 'participant';
    contenido += `  ${keyword} ${idLocal} as ${nombre}\n`;
  }
  contenido += '\n';

  const activacionAParticipante = new Map<string, string>();
  for (const nodo of nodos) {
    if (nodo.type.toLowerCase().includes('activacion') || nodo.type.toLowerCase().includes('activation')) {
      const idPadre = nodo.parentNode || nodo.groupId || '';
      const idParticipanteLimpiado = mapaNombres.get(idPadre);
      if (idParticipanteLimpiado) activacionAParticipante.set(nodo.id, idParticipanteLimpiado);
    }
  }

  const aristasOrdenadas = [...aristas].sort(
    (a, b) => (a.points?.[0]?.y ?? 0) - (b.points?.[0]?.y ?? 0)
  );

  for (const arista of aristasOrdenadas) {
    const origen = activacionAParticipante.get(arista.source) ?? mapaNombres.get(arista.source) ?? cleanId(arista.source);
    const destino = activacionAParticipante.get(arista.target) ?? mapaNombres.get(arista.target) ?? cleanId(arista.target);
    
    const accion = arista.data?.label || arista.data?.mensaje || arista.data?.text || 'interactua';
    const estiloFlecha = arista.data?.tipoRelacion === 'retorno' || arista.data?.dashed ? '-->>' : '->>';
    
    contenido += `  ${origen}${estiloFlecha}${destino}: ${accion}\n`;
  }

  return contenido;
}

// EXPORTACIÓN

const procesadores: Record<string, (d: Diagrama) => string> = {
  clase: procesarDiagramaClase,
  class: procesarDiagramaClase,
  casos_uso: procesarDiagramaCasosUso,
  use_case: procesarDiagramaCasosUso,
  paquetes: procesarDiagramaPaquetes,
  package: procesarDiagramaPaquetes,
  secuencia: procesarDiagramaSecuencia,
  sequence: procesarDiagramaSecuencia,
};

export function procesarDiagrama(tipo: string, jsonDiagrama: string): string {
  try {
    const diagrama = JSON.parse(jsonDiagrama) as Diagrama;
    const procesador = procesadores[tipo];
    if (!procesador) return `(Tipo de diagrama "${tipo}" no soportado)\n`;
    return procesador(diagrama);
  } catch {
    return `(Error al procesar diagrama de tipo "${tipo}")\n`;
  }
}