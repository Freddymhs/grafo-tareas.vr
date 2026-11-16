/** La API del grafo (grafo-tareas.api). En el visor llega por `adb reverse` al mismo `localhost:3000`. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Toda la red de una vez: hoy ~165 nodos; el tope de la API es 500. */
export const LIMITE_GRAFO = 500

/** Lo leído vale un minuto: el mapa no se recalcula mientras se mira. */
export const VIGENCIA_CONSULTA_MS = 60_000

/** Lecturas secundarias que fallan sin tumbar el mapa: se dice qué falta (el mapa se ve igual). */
export const AVISO_GUARDAR_POSICIONES = 'No se pudieron guardar las posiciones nuevas'
export const AVISO_VECINOS_NO_LEIDOS = 'No se pudieron leer los vecinos de otros proyectos'
export const AVISO_PLAN_NO_LEIDO = 'No se pudo leer el plan: faltan los números de cada pieza'
export const AVISO_ULTIMO_CAMBIO_NO_LEIDO = 'No se pudo leer el último cambio de la página'
export const SEPARADOR_DE_AVISOS = ' · '
/** El Worker del layout falló: sin él no hay acomodo y el mapa no se puede dibujar. */
export const ERROR_LAYOUT = 'No se pudo acomodar el mapa'
