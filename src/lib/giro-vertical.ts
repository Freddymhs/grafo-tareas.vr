// El giro de la mano alrededor del eje vertical entre dos orientaciones (FASE 15, girar la pelota). Puro.
import type { Quaternion } from 'three'

/** Cuánto giró alrededor del eje vertical (rad, positivo a la derecha) de `antes` a `ahora`, en el espacio del mundo. */
export function giroVertical(antes: Quaternion, ahora: Quaternion): number {
  const delta = ahora.clone().multiply(antes.clone().invert())
  // El mismo giro tiene dos cuaterniones (q y −q): el de w ≥ 0 es el del ángulo corto.
  const w = Math.min(1, Math.abs(delta.w))
  const signo = delta.w < 0 ? -1 : 1
  const angulo = 2 * Math.acos(w)
  const seno = Math.sqrt(1 - w * w)
  if (seno < 1e-6) return 0
  // Girar a la izquierda es positivo alrededor de +Y (regla de la mano derecha): a la derecha, negativo.
  return -((signo * delta.y) / seno) * angulo
}
