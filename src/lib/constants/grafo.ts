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

/** El fondo de la escena (y hacia donde se apaga lo que no está seleccionado). */
export const COLOR_FONDO = '#020617'
export const COLOR_SIN_RAMA = '#94a3b8'
export const COLOR_PERSONA = '#f8fafc'
export const COLOR_DUDA = '#ef4444'
/** El esqueleto del árbol (FASE 13): la HU es el centro de su racimo y la FASE el documento de una task. */
export const COLOR_HISTORIA = '#fde68a'
export const COLOR_FASE = '#c4b5fd'
export const COLOR_ARISTA = '#64748b'
export const OPACIDAD_ARISTA = 0.6
/** PERTENECE_A es la mitad de las aristas y el color del nodo ya dice la rama: va tenue para no tapar los bloqueos. */
export const OPACIDAD_PERTENENCIA = 0.08
/** PERTENECE_A una FASE o una HU es el árbol (tarjeta → FASE → HU): se ve, a diferencia de la pertenencia a una rama. */
export const OPACIDAD_ESTRUCTURA = 0.4
/** Con un nodo seleccionado (FASE 15): las líneas de su familia, brillantes; las demás, casi invisibles. */
export const OPACIDAD_ILUMINADA = 0.9
export const OPACIDAD_APAGADA = 0.03

/** Radio (m) de la esfera de cada nodo, antes de escalarla por tipo o selección. */
export const RADIO_NODO = 0.05
/** La pone la API cuando la FASE tiene tildada su casilla `Mergeado` (FASE 17 de grafo-tareas). */
export const ETIQUETA_MERGEADA = 'mergeada'
/** La pone la API en los trámites de cierre (URL commit, evidencias, wiki): el filtro 3 los apaga (FASE 15 t3). */
export const ETIQUETA_TRAMITE = 'complemento:tramite'
