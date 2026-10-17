import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'

const NODOS_MINIMO = 30
const NODOS_MAXIMO = 2000

/** De dónde sale el grafo: la API (lo normal) o el generador de la FASE 1 (la medición de FPS). */
export const FuenteGrafo = {
  API: 'api',
  SINTETICO: 'sintetico',
} as const
export type FuenteGrafo = (typeof FuenteGrafo)[keyof typeof FuenteGrafo]

export interface ParametrosPrueba {
  readonly fuente: FuenteGrafo
  readonly nodos: number
  readonly semilla: number
}

function entero(valor: string | null, porDefecto: number): number {
  const numero = Number(valor)
  return valor !== null && Number.isInteger(numero) ? numero : porDefecto
}

/**
 * Sin query, el grafo real de la API. `?nodos=300&semilla=7` (o `?sintetico`) es la prueba de la FASE 1: mide con
 * 100, 300 y 500 nodos sintéticos sin recompilar. Fuera de rango → el default.
 */
export function leerParametros(busqueda: string): ParametrosPrueba {
  const query = new URLSearchParams(busqueda)
  const esPrueba = query.has('nodos') || query.has('sintetico')
  const nodos = entero(query.get('nodos'), NODOS_PRUEBA)
  const enRango = nodos >= NODOS_MINIMO && nodos <= NODOS_MAXIMO
  return {
    fuente: esPrueba ? FuenteGrafo.SINTETICO : FuenteGrafo.API,
    nodos: enRango ? nodos : NODOS_PRUEBA,
    semilla: entero(query.get('semilla'), SEMILLA_PRUEBA),
  }
}
