// Lo que comparten los gestos de la mano (girar la pelota, FASE 15; dar vuelta la hoja, FASE 17): leer dónde está cada
// articulación en el frame, cuánto se doblan los dedos y cómo se muestra y se graba el progreso.
import { curvatura, type Punto } from '../lib/pose-mano'

/** Por debajo de esto el progreso no se muestra: la mano siempre se mueve un poco. */
export const PROGRESO_VISIBLE = 0.3
/** El progreso se redondea a décimos: re-renderizar en cada frame no hace falta para un indicador. */
export const PASOS_DE_PROGRESO = 10
/** `?depurar`: cuántas muestras se guardan (~1 min a 72 Hz) para calibrar los umbrales con datos reales. */
export const MUESTRAS_DEPURACION = 4320

const ARTICULACIONES_DEDO = [
  'metacarpal',
  'phalanx-proximal',
  'phalanx-intermediate',
  'phalanx-distal',
  'tip',
] as const
const DEDOS = ['index-finger', 'middle-finger', 'ring-finger'] as const

/** Dónde está una articulación en este frame; `null` si el visor no la ve. */
export function puntoDe(
  frame: XRFrame,
  mano: XRHand,
  espacio: XRSpace,
  articulacion: XRHandJoint,
): Punto | null {
  const espacioArticulacion = mano.get(articulacion)
  const pose = espacioArticulacion ? frame.getJointPose?.(espacioArticulacion, espacio) : undefined
  return pose ? pose.transform.position : null
}

/** Cuánto se doblan el índice, el medio y el anular (0 estirado → 1 cerrado); NaN si el visor perdió un dedo. */
export function curvaturasDe(frame: XRFrame, mano: XRHand, espacio: XRSpace): number[] {
  return DEDOS.map((dedo) => curvaturaDe(frame, mano, espacio, dedo))
}

/** El pulgar no tiene falange intermedia: sus articulaciones van aparte. */
const ARTICULACIONES_PULGAR = [
  'thumb-metacarpal',
  'thumb-phalanx-proximal',
  'thumb-phalanx-distal',
  'thumb-tip',
] as const

export type Dedo = 'thumb' | (typeof DEDOS)[number] | 'pinky-finger'

function articulacionesDe(dedo: Dedo): readonly XRHandJoint[] {
  if (dedo === 'thumb') return ARTICULACIONES_PULGAR
  return ARTICULACIONES_DEDO.map((a) => `${dedo}-${a}` as const)
}

/** Cuánto se dobla un dedo cualquiera, pulgar y meñique incluidos (0 estirado → 1 cerrado); NaN si el visor lo perdió. */
export function curvaturaDe(frame: XRFrame, mano: XRHand, espacio: XRSpace, dedo: Dedo): number {
  const puntos = articulacionesDe(dedo).map((a) => puntoDe(frame, mano, espacio, a))
  return puntos.every((p): p is Punto => p !== null) ? curvatura(puntos) : Number.NaN
}
