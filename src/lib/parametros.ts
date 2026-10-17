import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'
import { RADIO_PANORAMA } from './layout'

const NODOS_MINIMO = 30
const NODOS_MAXIMO = 2000
/** m: más cerca la pantalla tapa la vista; más lejos el texto no se lee. */
const RADIO_MINIMO = 1.5
const RADIO_MAXIMO = 10

/** De dónde sale el grafo: la API (lo normal) o el generador de la FASE 1 (la medición de FPS). */
export const FuenteGrafo = {
  API: 'api',
  SINTETICO: 'sintetico',
} as const
export type FuenteGrafo = (typeof FuenteGrafo)[keyof typeof FuenteGrafo]

/** Qué nodos llevan su texto: todos (para ver si el acomodo se lee, FASE 15) o solo los más cercanos (FASE 1, D3). */
export const ModoEtiquetas = {
  TODAS: 'todas',
  CERCANAS: 'cercanas',
} as const
export type ModoEtiquetas = (typeof ModoEtiquetas)[keyof typeof ModoEtiquetas]

const esModoEtiquetas = (valor: string | null): valor is ModoEtiquetas =>
  Object.values<string | null>(ModoEtiquetas).includes(valor)

export interface ParametrosPrueba {
  readonly fuente: FuenteGrafo
  readonly nodos: number
  readonly semilla: number
  /** Recalcula el layout entero e ignora las posiciones guardadas (y las reemplaza): el árbol cambió. */
  readonly reordenar: boolean
  /** Distancia de la pantalla curva (FASE 15); vale al calcular el layout (`?reordenar` o mapa vacío). */
  readonly radio: number
  /** Por defecto: el grafo real, todas; la medición de FPS, las cercanas (la de la FASE 1). */
  readonly etiquetas: ModoEtiquetas
}

function entero(valor: string | null, porDefecto: number): number {
  const numero = Number(valor)
  return valor !== null && Number.isInteger(numero) ? numero : porDefecto
}

/** Un decimal dentro de [minimo, maximo]; si no, el default. */
function decimalEnRango(
  valor: string | null,
  minimo: number,
  maximo: number,
  porDefecto: number,
): number {
  const numero = Number(valor)
  const valido = valor !== null && Number.isFinite(numero) && numero >= minimo && numero <= maximo
  return valido ? numero : porDefecto
}

/**
 * Sin query, el grafo real de la API. `?nodos=300&semilla=7` (o `?sintetico`) es la prueba de la FASE 1: mide con
 * 100, 300 y 500 nodos sintéticos sin recompilar. Fuera de rango → el default.
 */
export function leerParametros(busqueda: string): ParametrosPrueba {
  const query = new URLSearchParams(busqueda)
  const esPrueba = query.has('nodos') || query.has('sintetico')
  const etiquetasPedidas = query.get('etiquetas')
  const nodos = entero(query.get('nodos'), NODOS_PRUEBA)
  const enRango = nodos >= NODOS_MINIMO && nodos <= NODOS_MAXIMO
  return {
    fuente: esPrueba ? FuenteGrafo.SINTETICO : FuenteGrafo.API,
    nodos: enRango ? nodos : NODOS_PRUEBA,
    semilla: entero(query.get('semilla'), SEMILLA_PRUEBA),
    reordenar: query.has('reordenar'),
    radio: decimalEnRango(query.get('radio'), RADIO_MINIMO, RADIO_MAXIMO, RADIO_PANORAMA),
    etiquetas: esModoEtiquetas(etiquetasPedidas)
      ? etiquetasPedidas
      : esPrueba
        ? ModoEtiquetas.CERCANAS
        : ModoEtiquetas.TODAS,
  }
}
