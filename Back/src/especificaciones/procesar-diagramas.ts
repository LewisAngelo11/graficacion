// Convierte JSON de ReactFlow a texto legible para el agente
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
    [key: string]: any; // Esto permite que acepte otras propiedades
  };
  points?: { x: number; y: number }[];
}

interface Diagrama {
  nodes: Nodo[];
  edges: Arista[];
}

function procesarDiagramaClase(diagrama: Diagrama): string {
  const { nodes: nodos, edges: aristas } = diagrama;
  let contenido = '';
  const mapaNodos = new Map<string, Nodo>();

  for (const nodo of nodos) mapaNodos.set(nodo.id, nodo);

  for (const nodo of nodos) {
    const { type, data } = nodo;
    const typeLower = type.toLowerCase();
    
    const esClase = typeLower.includes('clas');
    const esInterfaz = typeLower.includes('interfa');
    const esEnum = typeLower.includes('enum');

    if (!esClase && !esInterfaz && !esEnum) continue;

    const nombre = data.nombre || data.label || 'EntidadDesconocida';

    if (esClase) contenido += `Clase: ${nombre}`;
    else if (esInterfaz) contenido += `Interfaz: ${nombre}`;
    else if (esEnum) contenido += `Enum: ${nombre}`;

    // Extraemos de forma segura usando el extractor universal
    const atributosRaw = data.atributos || data.attributes || data.propiedades || [];
    const metodosRaw = data.metodos || data.methods || data.operaciones || [];

    const atributos = extraerLista(atributosRaw);
    if (atributos.length > 0) {
      contenido += `\nAtributos\n`;
      for (const atributo of atributos) contenido += `- ${atributo}\n`;
    }

    const metodos = extraerLista(metodosRaw);
    if (metodos.length > 0) {
      contenido += `\nMétodos\n`;
      for (const metodo of metodos) contenido += `- ${metodo}\n`;
    }

    const relaciones = aristas.filter(a => a.source === nodo.id || a.target === nodo.id);
    if (relaciones.length > 0) {
      contenido += `\nRelaciones:\n`;
      for (const rel of relaciones) {
        const origen = mapaNodos.get(rel.source);
        const destino = mapaNodos.get(rel.target);
        if (!origen || !destino) continue;
        
        const nombreOrigen = origen.data?.nombre || origen.data?.label || 'Origen';
        const nombreDestino = destino.data?.nombre || destino.data?.label || 'Destino';
        
        if (rel.source === nodo.id) {
          contenido += `- ${nombreOrigen} -> ${nombreDestino}\n`;
        } else {
          contenido += `- ${nombreDestino} -> ${nombreOrigen}\n`;
        }
      }
    }
    contenido += '\n\n';
  }
  return contenido;
}

function procesarDiagramaCasosUso(diagrama: Diagrama): string {
  const { nodes: nodos, edges: aristas } = diagrama;
  let contenido = 'Diagrama de casos de uso\n\n';
  const mapaNodos = new Map<string, Nodo>();

  for (const nodo of nodos) mapaNodos.set(nodo.id, nodo);

  // Filtros relajados
  const boundary = nodos.find(n => n.type.toLowerCase().includes('boundary') || n.type.toLowerCase().includes('sistema'));
  const actores = nodos.filter(n => n.type.toLowerCase().includes('actor'));
  
  // Si no es boundary ni actor, lo tratamos como caso de uso (atrapa a los óvalos "default")
  const casosUso = nodos.filter(n => 
      !n.type.toLowerCase().includes('actor') && 
      !n.type.toLowerCase().includes('boundary') &&
      !n.type.toLowerCase().includes('sistema')
  );

  if (boundary) contenido += `Sistema: ${obtenerNombreNodo(boundary)}\n\n`;

  if (actores.length > 0) {
    contenido += `Actores:\n`;
    for (const actor of actores) contenido += `- ${obtenerNombreNodo(actor)}\n`;
    contenido += '\n';
  }

  if (casosUso.length > 0) {
    contenido += `Casos de uso:\n`;
    for (const caso of casosUso) contenido += `- ${obtenerNombreNodo(caso)}\n`;
    contenido += '\n';
  }

  if (aristas.length > 0) {
    contenido += `Relaciones:\n`;
    for (const arista of aristas) {
      const origen = mapaNodos.get(arista.source);
      const destino = mapaNodos.get(arista.target);
      if (!origen || !destino) continue;
      
      contenido += `- ${obtenerNombreNodo(origen)} interactúa con ${obtenerNombreNodo(destino)}\n`;
    }
  }
  return contenido + '\n';
}

function procesarDiagramaPaquetes(diagrama: Diagrama): string {
  const { nodes: nodos, edges: aristas } = diagrama;
  let contenido = 'Diagrama de paquetes\n\n';
  const mapaNodos = new Map<string, Nodo>();

  for (const nodo of nodos) mapaNodos.set(nodo.id, nodo);

  const paquetes = nodos.filter(n => n.type.toLowerCase().includes('paquet') || n.type.toLowerCase().includes('package'));
  const getPadreId = (nodo: Nodo) => nodo.parentNode || nodo.groupId;

  if (paquetes.length > 0) {
    contenido += `Paquetes:\n`;
    for (const p of paquetes) contenido += `- ${obtenerNombreNodo(p)}\n`;
    contenido += '\n';
  }

  if (aristas.length > 0) {
    contenido += `Dependencias:\n`;
    for (const arista of aristas) {
      const origen = mapaNodos.get(arista.source);
      const destino = mapaNodos.get(arista.target);
      if (!origen || !destino) continue;
      contenido += `- ${obtenerNombreNodo(origen)} depende de ${obtenerNombreNodo(destino)}\n`;
    }
    contenido += '\n';
  }

  const paquetesPadre = paquetes.filter(p => !getPadreId(p));
  if (paquetesPadre.length > 0) {
    contenido += `Jerarquía de paquetes:\n`;
    for (const padre of paquetesPadre) {
      const hijos = paquetes.filter(p => getPadreId(p) === padre.id);
      if (hijos.length === 0) continue;
      contenido += `\n${obtenerNombreNodo(padre)}\n`;
      for (const hijo of hijos) contenido += `- ${obtenerNombreNodo(hijo)}\n`;
    }
  }
  return contenido + '\n';
}

function procesarDiagramaSecuencia(diagrama: Diagrama): string {
  const { nodes: nodos, edges: aristas } = diagrama;
  const mapaNombres = new Map<string, string>();

  // Mapeamos todos los nodos usando el buscador maestro
  for (const nodo of nodos) {
    mapaNombres.set(nodo.id, obtenerNombreNodo(nodo));
  }

  const activacionAParticipante = new Map<string, string>();
  for (const nodo of nodos) {
    if (nodo.type.toLowerCase().includes('activacion') || nodo.type.toLowerCase().includes('activation')) {
      const idPadre = nodo.parentNode || nodo.groupId || '';
      const participante = mapaNombres.get(idPadre);
      if (participante) activacionAParticipante.set(nodo.id, participante);
    }
  }

  const aristasOrdenadas = [...aristas].sort(
    (a, b) => (a.points?.[0]?.y ?? 0) - (b.points?.[0]?.y ?? 0)
  );

  const lineas = aristasOrdenadas.map(arista => {
    const origen = activacionAParticipante.get(arista.source) ?? mapaNombres.get(arista.source) ?? arista.source;
    const destino = activacionAParticipante.get(arista.target) ?? mapaNombres.get(arista.target) ?? arista.target;
    
    // Si no le pusiste texto a la flecha, usamos 'interactúa con'
    const accion = arista.data?.label || arista.data?.mensaje || arista.data?.text || 'interactúa con';
    
    return `${origen} -> ${destino}: ${accion}`;
  });

  return lineas.join('\n') + '\n';
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

// Extrae texto de arreglos, ya sean de strings o de objetos
function extraerLista(lista: any): string[] {
  if (!Array.isArray(lista)) return [];
  return lista.map(item => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      // Busca cualquier llave que suene a que contiene el nombre/texto
      return item.nombre || item.name || item.texto || item.label || item.valor || JSON.stringify(item);
    }
    return String(item);
  });
}

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