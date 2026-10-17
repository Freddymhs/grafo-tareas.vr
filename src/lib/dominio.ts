// El modelo de dominio de `docs/_CONCEPTO.md` § Modelo de dominio. En la FASE 4 lo reemplazan los tipos que
// genera Orval desde el OpenAPI de la API; los nombres son los mismos a propósito.

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

/** Las conexiones que bloquean a su origen mientras el destino siga ABIERTO. */
export const CONEXIONES_BLOQUEANTES: ReadonlySet<TipoConexion> = new Set([
  TipoConexion.DEPENDE_DE,
  TipoConexion.BLOQUEADA_POR,
  TipoConexion.ESPERA_RESPUESTA_DE,
])

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
