import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'

const NODOS_MINIMO = 30
const NODOS_MAXIMO = 2000

export interface ParametrosPrueba {
  readonly nodos: number
  readonly semilla: number
}

function entero(valor: string | null, porDefecto: number): number {
  const numero = Number(valor)
  return valor !== null && Number.isInteger(numero) ? numero : porDefecto
}

/** `?nodos=300&semilla=7`: la FASE 1 mide con 100, 300 y 500 sin recompilar. Fuera de rango → el default. */
export function leerParametros(busqueda: string): ParametrosPrueba {
  const query = new URLSearchParams(busqueda)
  const nodos = entero(query.get('nodos'), NODOS_PRUEBA)
  const enRango = nodos >= NODOS_MINIMO && nodos <= NODOS_MAXIMO
  return {
    nodos: enRango ? nodos : NODOS_PRUEBA,
    semilla: entero(query.get('semilla'), SEMILLA_PRUEBA),
  }
}
