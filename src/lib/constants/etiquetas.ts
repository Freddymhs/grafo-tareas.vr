// Medidas del texto 3D (m). SSOT: las usa el dibujo (`escena/Etiquetas.tsx`) y el acomodo (`lib/layout.ts`), que
// reserva para cada nodo la celda de su etiqueta para que ninguna pise a otra (FASE 15).

export const TAMANO_TEXTO = 0.035
export const TAMANO_TEXTO_HU = 0.08
/** El título corto parte en dos líneas en vez de una larga que pisa a los vecinos. */
export const ANCHO_ETIQUETA = 0.45
/** La de la HU es más grande: con el ancho de las demás partía su nombre en cinco líneas. */
export const ANCHO_ETIQUETA_HU = 1.6
/** Cuánto sube la etiqueta sobre su esfera. */
export const DESPLAZAMIENTO_Y = 0.09
/** La etiqueta del nodo bajo el rayo: más grande, más ancha y adelantada hacia el usuario (no la tapan las vecinas). */
export const TAMANO_TEXTO_APUNTADO = 0.05
export const ANCHO_ETIQUETA_APUNTADA = 1.1
export const ADELANTE_APUNTADA = 0.85
export const BORDE_APUNTADA = 0.004

const MARGEN = 0.06
const INTERLINEADO = 1.2
/** Cuántas líneas lleva una etiqueta: 2 en una página llena, hasta 4 donde sobra espacio (FASE 15). */
export const LINEAS_MINIMAS = 2
export const LINEAS_MAXIMAS = 4
/** Letras que caben en una línea de ANCHO_ETIQUETA con TAMANO_TEXTO (medido: 48 letras = 2 líneas). */
const LETRAS_POR_LINEA = 24

export interface Medidas {
  readonly ancho: number
  readonly alto: number
}

/**
 * Lo que ocupa una etiqueta de `lineas` líneas: el bloque de texto (lo que no puede pisar al de otra), la celda (la esfera
 * abajo, el texto arriba y aire alrededor) y cuántas letras entran.
 */
export function medidasEtiqueta(lineas: number): {
  readonly texto: Medidas
  readonly celda: Medidas
  readonly largo: number
} {
  const altoTexto = lineas * TAMANO_TEXTO * INTERLINEADO
  return {
    texto: { ancho: ANCHO_ETIQUETA, alto: altoTexto },
    celda: { ancho: ANCHO_ETIQUETA + MARGEN, alto: DESPLAZAMIENTO_Y + altoTexto + MARGEN },
    largo: lineas * LETRAS_POR_LINEA,
  }
}

/** Lo que mide de ancho una letra, en tamaños de letra: sale de las 24 letras que caben en ANCHO_ETIQUETA. */
const ANCHO_LETRA = ANCHO_ETIQUETA / (LETRAS_POR_LINEA * TAMANO_TEXTO)
/** La división en coma flotante da 23,999…: sin esto, en el ancho medido de 24 letras cabían 23. */
const TOLERANCIA = 1e-9

/** Cuánto baja un texto de `tamano` que parte en líneas de `ancho`: para poner otro debajo sin medirlo en el visor. */
export function altoDeTexto(texto: string, tamano: number, ancho: number): number {
  const letrasPorLinea = Math.max(1, Math.floor(ancho / (tamano * ANCHO_LETRA) + TOLERANCIA))
  const lineas = Math.max(1, Math.ceil(texto.length / letrasPorLinea))
  return lineas * tamano * INTERLINEADO
}

/** La de dos líneas: el caso de una página llena. */
export const TEXTO = medidasEtiqueta(LINEAS_MINIMAS).texto
export const CELDA = medidasEtiqueta(LINEAS_MINIMAS).celda

/** La HU: su nombre en una o dos líneas grandes. */
export const CELDA_HU = {
  ancho: ANCHO_ETIQUETA_HU + MARGEN,
  alto: DESPLAZAMIENTO_Y + LINEAS_MINIMAS * TAMANO_TEXTO_HU * INTERLINEADO + MARGEN,
} as const
