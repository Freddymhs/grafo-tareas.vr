/** La API del grafo (grafo-tareas.api). En el visor llega por `adb reverse` al mismo `localhost:3000`. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Toda la red de una vez: hoy ~165 nodos; el tope de la API es 500. */
export const LIMITE_GRAFO = 500

/** Lo leído vale un minuto: el mapa no se recalcula mientras se mira. */
export const VIGENCIA_CONSULTA_MS = 60_000
