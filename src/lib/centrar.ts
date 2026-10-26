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

/** Hasta dónde llega cada lado: casi el borde de la media vuelta de adelante, con aire para la última etiqueta. */
const BORDE = (85 * Math.PI) / 180
/** Una página chica no se desparrama por toda la pantalla: a lo más se abre la mitad más. */
const ESTIRAR_MAXIMO = 1.5

/**
 * Con la HU al frente, la red quedaba corrida a un lado y el otro vacío (26-10, HU 20379:
 * de −89° a +60°; «estamos desaprovechando el ancho»). Cada lado se abre por separado hasta el borde, sin mover la HU ni
 * las alturas. Solo la vista.
 */
export function abrirHaciaLosBordes(
  posiciones: ReadonlyMap<string, Posicion>,
): ReadonlyMap<string, Posicion> {
  const angulos = [...posiciones.values()].map(anguloDe)
  const derecha = Math.max(0, ...angulos)
  const izquierda = Math.min(0, ...angulos)
  const factor = (extremo: number) =>
    extremo === 0 ? 1 : Math.min(ESTIRAR_MAXIMO, Math.max(1, BORDE / Math.abs(extremo)))
  const aLaDerecha = factor(derecha)
  const aLaIzquierda = factor(izquierda)
  return new Map(
    [...posiciones].map(([id, posicion]) => {
      const angulo = anguloDe(posicion)
      const estirado = angulo * (angulo >= 0 ? aLaDerecha : aLaIzquierda)
      return [id, enCilindro(estirado, posicion.y, Math.hypot(posicion.x, posicion.z))] as const
    }),
  )
}
