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
const LINEAS = 2
const INTERLINEADO = 1.2

/** El bloque de texto de una etiqueta: dos líneas. Lo que no puede pisar al de otra. */
export const TEXTO = { ancho: ANCHO_ETIQUETA, alto: LINEAS * TAMANO_TEXTO * INTERLINEADO } as const

/** Lo que ocupa un nodo con su etiqueta: la esfera abajo, dos líneas de texto arriba, y aire alrededor. */
export const CELDA = {
  ancho: ANCHO_ETIQUETA + MARGEN,
  alto: DESPLAZAMIENTO_Y + LINEAS * TAMANO_TEXTO * INTERLINEADO + MARGEN,
} as const

/** La HU: su nombre en una o dos líneas grandes. */
export const CELDA_HU = {
  ancho: ANCHO_ETIQUETA_HU + MARGEN,
  alto: DESPLAZAMIENTO_Y + LINEAS * TAMANO_TEXTO_HU * INTERLINEADO + MARGEN,
} as const
