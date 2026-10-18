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

/** La media del índice, el medio y el anular. Si el visor perdió un dedo (NaN), NaN: ninguna pose la acepta. */
function curvaturaMedia(curvaturas: readonly number[]): number {
  if (curvaturas.length === 0) return Number.NaN
  return curvaturas.reduce((suma, c) => suma + c, 0) / curvaturas.length
}

export function esPoseDePelota(curvaturas: readonly number[]): boolean {
  const media = curvaturaMedia(curvaturas)
  return media >= CURVATURA_PELOTA_MINIMA && media <= CURVATURA_PELOTA_MAXIMA
}

/** La mano abierta (FASE 17, dar vuelta la hoja): los dedos estirados. Medido en Freddy: abierta 0,00–0,01. */
export const CURVATURA_ABIERTA_MAXIMA = 0.1

export function esManoAbierta(curvaturas: readonly number[]): boolean {
  return curvaturaMedia(curvaturas) <= CURVATURA_ABIERTA_MAXIMA
}

/**
 * La mano levantada, para TODOS los gestos (Freddy, 2026-10-18): con la mano abajo, en reposo, cualquier movimiento
 * parecía un gesto. Cuenta la muñeca hasta esto por debajo de los ojos: el hombro (el pecho, 0,45 m, no alcanzaba).
 * Se mide desde la cabeza, así vale igual sentado o de pie. Primera estimación: se calibra con `?depurar`.
 */
export const MANO_ALZADA_BAJO_LOS_OJOS_M = 0.3

export function esManoAlzada(alturaMuneca: number, alturaOjos: number): boolean {
  return alturaOjos - alturaMuneca <= MANO_ALZADA_BAJO_LOS_OJOS_M
}

/** Las puntas del pulgar y del índice juntas: el pellizco con que Meta hace clic y abre su menú. Primera estimación. */
export const PELLIZCO_MAXIMO_M = 0.025
/** La palma mira a los ojos si su normal y la dirección a los ojos forman menos de 60° (coseno 0,5). A calibrar. */
export const PALMA_HACIA_LA_CARA_COSENO_MINIMO = 0.5

const resta = (a: Punto, b: Punto): Punto => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const cruz = (a: Punto, b: Punto): Punto => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})
const largo = ({ x, y, z }: Punto) => Math.hypot(x, y, z)
const coseno = (a: Punto, b: Punto) => (a.x * b.x + a.y * b.y + a.z * b.z) / (largo(a) * largo(b))

export interface PuntosDeMeta {
  readonly muneca: Punto
  readonly baseIndice: Punto
  readonly baseMenique: Punto
  readonly puntaPulgar: Punto
  readonly puntaIndice: Punto
  readonly ojos: Punto
}

/**
 * El gesto de sistema de Meta con la mano DERECHA: la palma hacia la cara y el pulgar tocando el índice —abre su menú—.
 * Ningún gesto nuestro lo usa: se ignora (Freddy en el visor, 2026-10-18). Solo el pellizco no alcanza para ignorarlo:
 * el 3 («OK») también junta el pulgar con el índice. En la mano derecha, (base del índice − muñeca) × (base del meñique −
 * muñeca) sale por la palma.
 */
export function esGestoDeMeta(puntos: PuntosDeMeta): boolean {
  const { muneca, baseIndice, baseMenique, puntaPulgar, puntaIndice, ojos } = puntos
  const esPellizco = largo(resta(puntaPulgar, puntaIndice)) <= PELLIZCO_MAXIMO_M
  const normalDeLaPalma = cruz(resta(baseIndice, muneca), resta(baseMenique, muneca))
  const palmaHaciaLaCara =
    coseno(normalDeLaPalma, resta(ojos, muneca)) >= PALMA_HACIA_LA_CARA_COSENO_MINIMO
  return esPellizco && palmaHaciaLaCara
}
