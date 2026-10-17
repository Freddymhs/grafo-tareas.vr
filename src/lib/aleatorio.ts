// Número pseudoaleatorio SIN estado: el mismo (semilla, índice) da siempre el mismo valor.
// Sin `Math.random` (regla de pureza de React 19) y sin un generador mutable que haya que ir pasando.

const MULTIPLICADOR_DORADO = 0x9e3779b9
const UINT32 = 2 ** 32

/** Valor en [0, 1) para la posición `indice` de la secuencia `semilla` (mezcla de mulberry32). */
export function aleatorio(semilla: number, indice: number): number {
  const entrada = (semilla + Math.imul(indice + 1, MULTIPLICADOR_DORADO)) >>> 0
  const paso1 = Math.imul(entrada ^ (entrada >>> 15), entrada | 1)
  const paso2 = paso1 ^ (paso1 + Math.imul(paso1 ^ (paso1 >>> 7), paso1 | 61))
  return ((paso2 ^ (paso2 >>> 14)) >>> 0) / UINT32
}

/** Entero en [0, maximo) para la posición `indice`. */
export function enteroAleatorio(semilla: number, indice: number, maximo: number): number {
  return Math.floor(aleatorio(semilla, indice) * maximo)
}
