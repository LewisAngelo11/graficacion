import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Contenido de los archivos estáticos

const INSTRUCCIONES_AGENTE = `# 01_INSTRUCCIONES_AGENTE

## OBJETIVO
Eres un agente implementador. Tu única tarea es construir desde cero la aplicación descrita en estos archivos, respetando estrictamente la arquitectura, el modelo de datos y los requisitos definidos. 
No hagas preguntas. No pidas confirmación. No propongas alternativas. Si un detalle no está especificado, aplica la convención estándar del stack.

## STACK 
| Capa | Tecnología | Versión mínima |
|---|---|---|
| Frontend | React + TypeScript | 18+ |
| Backend | Express + TypeScript | 4+ |
| ORM | Prisma | latest |
| Base de datos | PostgreSQL | 15+ |
| Lenguaje | TypeScript | 5+ |

## ORDEN DE LECTURA (OBLIGATORIO — NO OMITIR NI REORDENAR)
1. 01_INSTRUCCIONES_AGENTE — Este archivo
2. 02_DATOS_GENERALES — Contexto del proyecto
3. 03_PRINCIPIOS_DESARROLLO — Principios de ingeniería
4. 04_CLASES_SISTEMA — Entidades, atributos y relaciones
5. 05_DETALLES_TECNICOS — Arquitectura y convenciones técnicas
6. 06_DISEÑO — Design system
7. 07_EJECUCION — Fases de construcción
8. DIAGRAMAS — Diagramas UML del proyecto

Si en algún momento existe ambigüedad, elige consistencia sobre creatividad.

## ALCANCE
### DEBE INCLUIR
- Estructura de carpetas completa
- schema.prisma completo derivado de 04_CLASES_SISTEMA
- Endpoints REST alineados a 02_DATOS_GENERALES
- Componentes React aplicando 06_DISEÑO
- Servicios HTTP en frontend para cada endpoint
- Validaciones básicas en frontend y backend
- Variables de entorno en .env

### NO DEBE INCLUIR
- Datos de seed o fixtures
- Datos hardcodeados
- Optimizaciones de performance

## REGLAS
### NUNCA:
- Inventar entidades, campos o endpoints no definidos en los archivos
- Hardcodear URLs, credenciales o secretos
- Usar SQL directo — siempre Prisma Client
- Saltarte una fase de 07_EJECUCION

### SIEMPRE:
- Respetar nombres exactos de 04_CLASES_SISTEMA
- Tipar estrictamente (TypeScript strict mode)
- Resolver errores antes de continuar con la siguiente fase`;

const PRINCIPIOS_DESARROLLO = `# 03_PRINCIPIOS_DESARROLLO

## OBJETIVO
Principios de ingeniería transversales a todas las capas. Sin excepciones.

## 1. DRY — Don't Repeat Yourself
- Evita duplicar lógica entre archivos o capas.
- Si una lógica aparece más de dos veces, extráela a una función reutilizable.
- Centraliza constantes, configuraciones y validaciones compartidas.

## 2. KISS — Keep It Simple, Stupid
- Prefiere soluciones simples sobre abstracciones complejas.
- Mantén funciones pequeñas y con un único propósito.
- Reduce anidaciones y complejidad innecesaria.

## 3. YAGNI — You Aren't Gonna Need It
- Implementa solo lo necesario actualmente.
- No agregues funcionalidades especulativas.

## 4. SOLID
- SRP: Cada módulo/función tiene una única responsabilidad.
- OCP: Extensión sin modificar código estable.
- LSP: Las implementaciones sustituyen sus abstracciones sin romper comportamiento.
- ISP: Interfaces pequeñas y específicas.
- DIP: Depende de abstracciones, no de implementaciones concretas.

## 5. MODULARIDAD
- Cada módulo con responsabilidad clara.
- Minimiza acoplamiento, maximiza cohesión.

## 6. MANEJO DE ERRORES
- Nunca ignorar errores silenciosamente.
- No exponer detalles técnicos al usuario final.
- Manejar errores en los límites del sistema.

## 7. SEGURIDAD
- Validar toda entrada externa.
- Nunca hardcodear secretos o credenciales.
- Usar siempre Prisma (consultas parametrizadas).

## RESTRICCIONES
| Prohibido | Razón |
|---|---|
| Copiar y pegar lógica | Viola DRY |
| Funciones de más de 40 líneas | Viola KISS y SRP |
| catch vacíos | Viola manejo de errores |
| SQL directo | Riesgo de seguridad |
| Estado global mutable | Genera bugs difíciles de rastrear |`;

const DETALLES_TECNICOS = `# 05_DETALLES_TECNICOS

## STACK DE BASE DE DATOS
Motor: PostgreSQL 15+ | ORM: Prisma latest | Conexión: DATABASE_URL

## ARQUITECTURA — PATRÓN MVC
| Capa | Responsabilidad |
|---|---|
| Model | Tipos e interfaces TypeScript. Sin lógica. |
| Service | Lógica de negocio + Prisma. |
| Controller | Maneja req/res. Sin lógica de negocio. |
| Route | Registra endpoints, apunta al controller. |

Flujo: Request → Route → Controller → Service → Prisma → BD

### Reglas estrictas:
- Controller NUNCA accede a Prisma directamente.
- Service NUNCA accede a req o res.
- Route NUNCA contiene lógica de negocio.

## ESTRUCTURA DE CARPETAS

### Backend
\`\`\`
/backend
 ├── .env
 ├── prisma/schema.prisma
 └── src/
     ├── index.ts
     ├── lib/prisma.ts
     ├── middleware/auth.middleware.ts
     └── modules/<modulo>/
         ├── <modulo>.model.ts
         ├── <modulo>.service.ts
         ├── <modulo>.controller.ts
         └── <modulo>.routes.ts
\`\`\`

### Frontend
\`\`\`
/frontend
 └── src/
     ├── main.tsx
     ├── App.tsx
     ├── api/<modulo>.api.ts
     ├── components/ui/
     ├── components/<modulo>/
     ├── pages/<Modulo>Page.tsx
     ├── hooks/use<Modulo>.ts
     └── types/<modulo>.types.ts
\`\`\`

## CONVENCIONES
- Archivos: kebab-case | Componentes: PascalCase | Hooks: use+camelCase
- Nombres prohibidos: data, manager, helper, utils, temp, misc, handler
- Códigos HTTP: 200 éxito, 201 creado, 400 cliente, 404 no encontrado, 500 servidor
- Toda URL del backend desde VITE_API_URL

## VARIABLES DE ENTORNO
### Backend
DATABASE_URL=postgresql://usuario:password@localhost:5432/lavaplus
JWT_SECRET=Token-Rubicon
PORT=3000

### Frontend
VITE_API_URL=http://localhost:3000/api`;

const DISEÑO = `# 06_DISEÑO

## TOKENS DE COLOR
:root {
  --color-accent:       #1a56db;
  --color-accent-dark:  #1e429f;
  --color-accent-light: #ebf5ff;
  --color-bg:           #f9fafb;
  --color-surface:      #ffffff;
  --color-border:       #e5e7eb;
  --color-text-primary: #111827;
  --color-text-muted:   #6b7280;
  --color-error:        #dc2626;
  --color-success:      #16a34a;
  --color-warning:      #d97706;
}

## TIPOGRAFÍA
font-family: 'Inter', sans-serif | line-height: 1.5
h1: 28px/600 | h2: 20px/600 | h3: 16px/500 | body: 14px/400 | sm: 13px/400 | xs: 12px/400
Importar: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap

## ESPACIADO
space: 4/8/12/16/24/32px | radius: sm=4px md=6px lg=10px full=9999px
shadow-sm: 0 1px 2px rgba(0,0,0,0.06) | shadow-md: 0 2px 8px rgba(0,0,0,0.08)

## BOTONES
Primary: bg=--color-accent text=#fff
Secondary: bg=--color-accent-light text=--color-accent border=1px solid --color-accent
Ghost: bg=transparent text=--color-text-muted border=1px solid --color-border
Danger: bg=--color-error text=#fff
height=36px | padding=0 16px | border-radius=--radius-md | font-weight=500

## CARDS
background=--color-surface | border=1px solid --color-border | border-radius=--radius-lg | padding=24px | box-shadow=--shadow-sm

## INPUTS
height=36px | border=1px solid --color-border | border-radius=--radius-md | padding=0 12px
Focus: border=--color-accent | box-shadow=0 0 0 3px --color-accent-light

## TABLAS
Header: bg=--color-bg | font-size=13px | color=--color-text-muted | uppercase | letter-spacing=0.04em
Row: border-bottom=1px solid --color-border | hover: bg=--color-bg | cell-padding=12px 16px

## BADGES DE ESTATUS
Recibida: bg=#eff6ff text=#1d4ed8 | EnProceso: bg=#fffbeb text=#b45309
Lista: bg=#f0fdf4 text=#15803d | Entregada: bg=#f9fafb text=#374151 | Cancelada: bg=#fef2f2 text=#b91c1c
border-radius=9999px | padding=2px 12px | font-size=12px | font-weight=500

## REGLAS
- Usar solo tokens definidos. Sin colores o tamaños literales.
- Fondo de página: --color-bg. Cards: --color-surface.
- Texto sobre acento siempre en #ffffff.
- Sin gradientes, sin sombras excesivas, sin animaciones complejas.
- Interfaz completamente responsiva.`;

const EJECUCION = `# 07_EJECUCION

## OBJETIVO
Orden de construcción por fases. Completar cada fase antes de iniciar la siguiente.

## FASE 1 — BASE DE DATOS
1. mkdir backend && cd backend && npm init -y
2. npm install typescript ts-node nodemon @types/node --save-dev
3. Crear tsconfig.json con strict: true
4. npm install prisma @prisma/client
5. npx prisma init
6. Definir schema.prisma basándose en 04_CLASES_SISTEMA
7. Configurar DATABASE_URL en .env
8. npx prisma db push
9. npx prisma generate
10. Crear src/lib/prisma.ts con instancia única de PrismaClient

Criterio de salida: npx prisma generate sin errores.

## FASE 2 — BACKEND (Express + TypeScript)
1. Instalar dependencias (ver 05_DETALLES_TECNICOS)
2. Crear src/index.ts con Express (cors, json, morgan)
3. Crear src/middleware/auth.middleware.ts
4. Crear módulos siguiendo patrón MVC de 05_DETALLES_TECNICOS
5. Implementar endpoints derivados de los datos generales del proyecto
6. Registrar rutas en src/index.ts bajo /api
7. npx tsc --noEmit

Criterio de salida: tsc sin errores y npm run dev levanta correctamente.

## FASE 3 — FRONTEND (React + TypeScript)
1. npm create vite@latest frontend -- --template react-ts
2. npm install react-router-dom
3. Configurar VITE_API_URL en .env
4. Crear tipos en src/types/ por módulo
5. Crear src/api/ por módulo
6. Crear src/hooks/ por módulo
7. Crear componentes base en src/components/ui/
8. Crear componentes por módulo
9. Crear páginas en src/pages/
10. Configurar rutas en src/App.tsx
11. npm run build

Criterio de salida: npm run build sin errores.

## REGLAS
- Resolver errores antes de continuar. No acumular errores entre fases.
- Variables de entorno en .env, nunca hardcodeadas.
- Backend y frontend son proyectos independientes con sus propios package.json.`;


const CLASES_SISTEMA = `# 04_CLASES_SISTEMA
 
## OBJETIVO
Este archivo define todas las entidades del sistema, sus atributos, tipos y relaciones. Es la **única fuente de verdad** para generar el schema.prisma, los modelos TypeScript y los DTOs del backend. Cualquier entidad, campo o relación no listada aquí **no debe ser implementada**.
 
---
 
## RESUMEN DE ENTIDADES
 
| Entidad | Descripción |
|---|---|
| Empleado | Persona autenticada que opera el sistema |
| Cliente | Persona que trae ropa a la lavandería |
| Orden | Registro de servicio solicitado por un cliente |
| Lote | Conjunto de prendas vinculado a una orden |
 
---
 
## DETALLE DE ENTIDADES
 
### Empleado
- id_empleado: Int PK autoincrement
- nombre: String VarChar(100) requerido
- email: String unique VarChar(100) requerido
- password_hash: String VarChar(64) hasheado con bcrypt 10 rounds
- estatus: String default A (A=Activo, I=Inactivo)
- Relación: un Empleado gestiona muchas Orden (1→N)
 
### Cliente
- id_cliente: Int PK autoincrement
- nombre: String VarChar(100) requerido
- telefono: String unique VarChar(15) — RN-01
- direccion: String? VarChar(200) opcional
- fecha_registro: DateTime default now()
- Relación: un Cliente tiene muchas Orden (1→N)
 
### Orden
- id_orden: Int PK autoincrement
- id_cliente: Int FK → Cliente
- id_empleado: Int FK → Empleado
- tipo_servicio: enum (Lavado, Planchado, Tintoreria, SoloSecado)
- es_expres: Boolean default false
- es_domicilio: Boolean default false
- estatus: enum default Recibida (Recibida, EnProceso, Lista, Entregada, Cancelada)
- fecha_entrada: DateTime default now()
- fecha_estimada: DateTime? opcional
- fecha_entrega: DateTime? se llena al entregar
- total: Decimal? ingresado manualmente — RN-06
- Relaciones: pertenece a Cliente (N→1), pertenece a Empleado (N→1), tiene muchos Lote (1→N)
 
### Lote
- id_lote: Int PK autoincrement
- id_orden: Int FK → Orden
- num_prendas: Int total de prendas
- descripcion: String Text — ej: "1 sudadera negra, 1 pantalón"
- Relación: pertenece a una Orden (N→1)
 
---
 
## TRANSICIONES DE ESTATUS VÁLIDAS
Recibida → EnProceso → Lista → Entregada
Cancelada: solo desde Recibida o EnProceso. Una vez Entregada o Cancelada no puede modificarse.
 
---
 
## RELACIONES
- Empleado 1→N Orden (onDelete: Restrict)
- Cliente 1→N Orden (onDelete: Restrict)
- Orden 1→N Lote (onDelete: Cascade)
 
---
 
## SCHEMA PRISMA
 
model Empleado {
  id_empleado   Int     @id @default(autoincrement())
  nombre        String  @db.VarChar(100)
  email         String  @unique @db.VarChar(100)
  password_hash String  @db.VarChar(64)
  estatus       String  @default("A") @db.VarChar(1)
  ordenes       Orden[]
}
 
model Cliente {
  id_cliente     Int      @id @default(autoincrement())
  nombre         String   @db.VarChar(100)
  telefono       String   @unique @db.VarChar(15)
  direccion      String?  @db.VarChar(200)
  fecha_registro DateTime @default(now())
  ordenes        Orden[]
}
 
model Orden {
  id_orden       Int           @id @default(autoincrement())
  id_cliente     Int
  id_empleado    Int
  tipo_servicio  tipo_servicio
  es_expres      Boolean       @default(false)
  es_domicilio   Boolean       @default(false)
  estatus        estatus_orden @default(Recibida)
  fecha_entrada  DateTime      @default(now())
  fecha_estimada DateTime?
  fecha_entrega  DateTime?
  total          Decimal?      @db.Decimal(10, 2)
  cliente        Cliente       @relation(fields: [id_cliente], references: [id_cliente], onDelete: Restrict)
  empleado       Empleado      @relation(fields: [id_empleado], references: [id_empleado], onDelete: Restrict)
  lotes          Lote[]
}
 
model Lote {
  id_lote     Int    @id @default(autoincrement())
  id_orden    Int
  num_prendas Int
  descripcion String @db.Text
  orden       Orden  @relation(fields: [id_orden], references: [id_orden], onDelete: Cascade)
}
 
enum tipo_servicio { Lavado Planchado Tintoreria SoloSecado }
enum estatus_orden { Recibida EnProceso Lista Entregada Cancelada }
`;


// Función principal: crea la carpeta y escribe todos los archivos
export async function generarArchivosEstaticos(
  nombreCarpeta: string,
  datosGenerales: string,
  diagramas: string
): Promise<string> {
  const rutaCarpeta = path.join(os.homedir(), 'Downloads', nombreCarpeta);
  await fs.mkdir(rutaCarpeta, { recursive: true });

  const archivos: Record<string, string> = {
    '01_INSTRUCCIONES_AGENTE.md': INSTRUCCIONES_AGENTE,
    '02_DATOS_GENERALES.md': datosGenerales,
    '03_PRINCIPIOS_DESARROLLO.md': PRINCIPIOS_DESARROLLO,
    '04_CLASES_SISTEMA.md': CLASES_SISTEMA,
    '05_DETALLES_TECNICOS.md': DETALLES_TECNICOS,
    '06_DISEÑO.md': DISEÑO,
    '07_EJECUCION.md': EJECUCION,
    'DIAGRAMAS.md': diagramas
  };

  for (const [nombre, contenido] of Object.entries(archivos)) {
    await fs.writeFile(path.join(rutaCarpeta, nombre), contenido, 'utf-8');
  }


  return rutaCarpeta;
}

export { INSTRUCCIONES_AGENTE, PRINCIPIOS_DESARROLLO, CLASES_SISTEMA, DETALLES_TECNICOS, DISEÑO, EJECUCION };