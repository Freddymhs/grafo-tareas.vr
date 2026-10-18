// El modelo que dibuja la escena: lo justo para el layout y los colores. Los datos reales llegan con los tipos que
// genera Orval (src/lib/api/generado) y `desde-api.ts` los baja a esto; el sintético de la FASE 1 los produce
// directo. Los nombres son los del OpenAPI a propósito. Qué bloquea a qué NO vive acá: lo calcula la API (C1).

export const TipoNodo = {
  TAREA: 'TAREA',
  HISTORIA: 'HISTORIA',
  FASE: 'FASE',
  RAMA: 'RAMA',
  DUDA: 'DUDA',
  PERSONA: 'PERSONA',
  PR: 'PR',
  DAILY_ITEM: 'DAILY_ITEM',
} as const
export type TipoNodo = (typeof TipoNodo)[keyof typeof TipoNodo]

export const TipoConexion = {
  DEPENDE_DE: 'DEPENDE_DE',
  ESPERA_RESPUESTA_DE: 'ESPERA_RESPUESTA_DE',
  BLOQUEADA_POR: 'BLOQUEADA_POR',
  PERTENECE_A: 'PERTENECE_A',
  EN_DAILY_DE: 'EN_DAILY_DE',
} as const
export type TipoConexion = (typeof TipoConexion)[keyof typeof TipoConexion]

export const EstadoNodo = {
  ABIERTO: 'ABIERTO',
  CERRADO: 'CERRADO',
} as const
export type EstadoNodo = (typeof EstadoNodo)[keyof typeof EstadoNodo]

/** Las dos caras de cada HU (FASE 17): lo que se trabaja y lo que se intuyó (el Draft). La decide la API. */
export const Cara = {
  REAL: 'REAL',
  PLAN: 'PLAN',
} as const
export type Cara = (typeof Cara)[keyof typeof Cara]

export interface Posicion {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface Nodo {
  readonly id: string
  readonly tipo: TipoNodo
  readonly titulo: string
  readonly estado: EstadoNodo
  /** Solo los nodos RAMA: el color de la rama (hex). */
  readonly color?: string
  /** Cuándo nació en su fuente (ISO, de la API; FASE 15). El sintético no la tiene. */
  readonly fecha?: string
  /** La FASE ya se mergeó (FASE 17): lo dice la API con una etiqueta; la VR solo lo muestra. */
  readonly mergeada?: boolean
  /** Un trámite de cierre (URL commit, evidencias, wiki): lo dice la API con una etiqueta; el filtro 3 lo apaga. */
  readonly tramite?: boolean
}

export interface Conexion {
  readonly id: string
  readonly origenId: string
  readonly destinoId: string
  readonly tipo: TipoConexion
}

export interface Grafo {
  readonly nodos: readonly Nodo[]
  readonly conexiones: readonly Conexion[]
}
