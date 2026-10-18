// Mostrar un número con la mano derecha (FASE 17): cada número es una FORMA de mano, la de Freddy (2026-10-18), no una
// cuenta de dedos; SOSTENIDA un momento con la mano levantada, el número se avisa una sola vez. Puro: recibe las curvaturas de los cinco dedos
// (`escena/GestoNumero.tsx` las saca de las articulaciones) y decide. Qué hace cada número lo decide quien integra.
// Los números son una primera estimación: se calibran con Freddy en el visor con `?depurar` (`window.__gestoNumero`).

/** Cuánto se dobla cada dedo (0 estirado → 1 cerrado); NaN si el visor perdió el dedo. */
export interface CurvaturasMano {
  readonly pulgar: number
  readonly indice: number
  readonly medio: number
  readonly anular: number
  readonly menique: number
}

/**
 * Hasta dónde un dedo cuenta como estirado. Medido en Freddy: abierta 0,00–0,01 · pelota 0,23–0,46 · puño 0,64–0,72;
 * un dedo levantado para contar puede venir algo doblado, así que el límite queda antes de la pelota.
 */
export const CURVATURA_ESTIRADO_MAXIMA = 0.2
/**
 * El pulgar tiene un segmento menos y, recogido sobre la palma, se dobla mucho menos que los otros: su límite es más
 * exigente. Primera estimación, a calibrar.
 */
export const CURVATURA_PULGAR_ESTIRADO_MAXIMA = 0.12

const estaEstirado = (curvatura: number, maxima: number) => curvatura <= maxima

interface Forma {
  readonly numero: number
  /** Índice, medio, anular y meñique: estirado o no. */
  readonly dedos: readonly [boolean, boolean, boolean, boolean]
  /** El pulgar decide solo entre el 4 y el 5; en los demás, el visor lo lee con ruido y no se mira (`null`). */
  readonly pulgar: boolean | null
}

/** 1 índice · 2 índice y medio · 3 medio, anular y meñique (el «OK») · 4 los cuatro · 5 los cinco. */
const FORMAS: readonly Forma[] = [
  { numero: 1, dedos: [true, false, false, false], pulgar: null },
  { numero: 2, dedos: [true, true, false, false], pulgar: null },
  { numero: 3, dedos: [false, true, true, true], pulgar: null },
  { numero: 4, dedos: [true, true, true, true], pulgar: false },
  { numero: 5, dedos: [true, true, true, true], pulgar: true },
]

/** El número que muestra la mano; 0 si no es ninguna de las formas. Un dedo perdido (NaN) no cuenta como estirado. */
export function numeroDeLaMano(curvaturas: CurvaturasMano): number {
  const { pulgar, indice, medio, anular, menique } = curvaturas
  const dedos = [indice, medio, anular, menique].map((c) =>
    estaEstirado(c, CURVATURA_ESTIRADO_MAXIMA),
  )
  const pulgarEstirado = estaEstirado(pulgar, CURVATURA_PULGAR_ESTIRADO_MAXIMA)
  const forma = FORMAS.find(
    (f) =>
      f.dedos.every((estirado, i) => estirado === dedos[i]) &&
      (f.pulgar === null || f.pulgar === pulgarEstirado),
  )
  return forma?.numero ?? 0
}

/** Cuánto hay que sostener el mismo número (s) para que cuente. */
export const SOSTENER_S = 0.6

export interface MuestraNumero {
  /** Segundos. */
  readonly t: number
  /** El número que muestra la mano en este frame (`numeroDeLaMano`); 0 = ninguno. */
  readonly numero: number
  /** Si la mano está levantada (`esManoAlzada`): con la mano abajo, el número no cuenta. */
  readonly alzada: boolean
}

export interface EstadoNumero {
  /** El número que se viene sosteniendo y desde cuándo. */
  readonly sostenido: { readonly numero: number; readonly desde: number } | null
  /** El número ya avisado: no se repite hasta que la mano cambie de número o se baje. */
  readonly emitido: number | null
}

export const NUMERO_INICIAL: EstadoNumero = { sostenido: null, emitido: null }

export function avanzarNumero(
  estado: EstadoNumero,
  muestra: MuestraNumero,
): {
  readonly estado: EstadoNumero
  readonly evento: number | null
  readonly progreso: number
} {
  const { t, numero, alzada } = muestra
  const esPuno = numero === 0
  if (!alzada || esPuno) return { estado: NUMERO_INICIAL, evento: null, progreso: 0 }

  const { sostenido: anterior, emitido } = estado
  const sigueElMismo = anterior !== null && anterior.numero === numero
  const sostenido = sigueElMismo ? anterior : { numero, desde: t }
  const yaAvisado = emitido === numero
  if (yaAvisado) return { estado: { sostenido, emitido: numero }, evento: null, progreso: 1 }

  const lleva = t - sostenido.desde
  if (lleva < SOSTENER_S) {
    return { estado: { sostenido, emitido: null }, evento: null, progreso: lleva / SOSTENER_S }
  }
  return { estado: { sostenido, emitido: numero }, evento: numero, progreso: 1 }
}
