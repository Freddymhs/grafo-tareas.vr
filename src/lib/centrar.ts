// Cada página arranca con su HU al frente (Freddy, 2026-10-26: «la 24576 aparece muy a la izquierda y de frente no hay
// nada»), como la barra de pestañas, que siempre está al frente. La HU es un solo nodo con una posición guardada, la de su
// página real; en el plan, o con el grafo creciendo, podía quedar a −70°. Esto gira la página entera alrededor del eje
// vertical para la VISTA: lo guardado no cambia (C2) y las distancias entre nodos tampoco. Puro.
import { anguloDe, enCilindro } from './layout'
import type { Posicion } from './dominio'

export function centrarEn(
  posiciones: ReadonlyMap<string, Posicion>,
  centro: string | null,
): ReadonlyMap<string, Posicion> {
  const posicionCentro = centro ? posiciones.get(centro) : undefined
  if (!posicionCentro) return posiciones
  const giro = anguloDe(posicionCentro)
  return new Map(
    [...posiciones].map(([id, posicion]) => {
      const radio = Math.hypot(posicion.x, posicion.z)
      return [id, enCilindro(anguloDe(posicion) - giro, posicion.y, radio)] as const
    }),
  )
}
