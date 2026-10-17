// Constantes del grafo sintético y de la escena de la FASE 1 (prueba en el visor).

/** Lo que la FASE 1 tiene que sostener a ≥ 72 FPS en el Quest 3S. */
export const NODOS_PRUEBA = 500
export const SEMILLA_PRUEBA = 20261016

/** Proporciones medidas en Todoist (concepto § Lo que Todoist no deja ver), redondeadas. */
export const CANTIDAD_PERSONAS = 5
export const CANTIDAD_DUDAS = 12
export const PROBABILIDAD_DOS_RAMAS = 0.2
export const PROBABILIDAD_DEPENDE_DE = 0.6
export const PROBABILIDAD_BLOQUEADA_POR_DUDA = 0.1
export const PROBABILIDAD_ESPERA_PERSONA = 0.08
export const PROBABILIDAD_CERRADO = 0.3
/** Un DEPENDE_DE apunta a una de las últimas N tareas: cadenas cortas, como en el Draft. */
export const VENTANA_DEPENDENCIA = 20

/** Los círculos de Freddy (🔵🟢🟠🟣) y dos más para que haya ramas de sobra. */
export const COLORES_RAMA = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#eab308',
  '#ec4899',
] as const

export const COLOR_SIN_RAMA = '#94a3b8'
export const COLOR_PERSONA = '#f8fafc'
export const COLOR_DUDA = '#ef4444'
export const COLOR_ARISTA = '#64748b'
export const OPACIDAD_ARISTA = 0.6
/** PERTENECE_A es la mitad de las aristas y el color del nodo ya dice la rama: va tenue para no tapar los bloqueos. */
export const OPACIDAD_PERTENENCIA = 0.08
