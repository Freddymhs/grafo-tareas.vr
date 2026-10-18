// La pose de la mano para girar la pelota (FASE 15): Freddy pidió que el giro cuente SOLO con la mano como agarrando una
// pelota — ni abierta ni en puño. La distancia de las puntas a la muñeca no las distinguía (0,13–0,18 m en las tres,
// medido 2026-10-17); cuánto se dobla cada dedo, sí. Puro.

export interface Punto {
  readonly x: number
  readonly y: number
  readonly z: number
}

const distancia = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

/**
 * Cuánto se dobla un dedo, de 0 (estirado) hacia 1 (cerrado): 1 − (base→punta en línea recta) / (largo del dedo por sus
 * articulaciones). `puntos` va de la base (metacarpo) a la punta. No depende del tamaño de la mano.
 */
export function curvatura(puntos: readonly Punto[]): number {
  const largo = puntos.slice(1).reduce((suma, p, i) => suma + distancia(puntos[i], p), 0)
  if (largo === 0) return 0
  return 1 - distancia(puntos[0], puntos[puntos.length - 1]) / largo
}

/**
 * La pose de la pelota: los dedos doblados a medias. Medido en Freddy (2026-10-17, `?depurar`): abierta 0,00–0,01 ·
 * pelota quieta 0,23–0,28 y girando 0,26–0,46 · puño 0,64–0,72. Los límites quedan en el medio de cada hueco.
 */
export const CURVATURA_PELOTA_MINIMA = 0.15
export const CURVATURA_PELOTA_MAXIMA = 0.55

/** Con la media del índice, el medio y el anular. Si el visor perdió un dedo (NaN), no es pelota. */
export function esPoseDePelota(curvaturas: readonly number[]): boolean {
  if (curvaturas.length === 0 || curvaturas.some(Number.isNaN)) return false
  const media = curvaturas.reduce((suma, c) => suma + c, 0) / curvaturas.length
  return media >= CURVATURA_PELOTA_MINIMA && media <= CURVATURA_PELOTA_MAXIMA
}
