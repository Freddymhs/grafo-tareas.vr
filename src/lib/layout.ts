// Layout de fuerzas en 3D, calculado UNA vez fuera del render (FASE 1, D4). Devuelve posiciones ya escaladas
// al mundo: el grafo envuelve al usuario, centrado a la altura de los ojos. En la FASE 4 se persisten (C2).

import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type NodoSimulacion,
} from 'd3-force-3d'
import type { Grafo, Posicion } from './dominio'

const DIMENSIONES = 3
export const TICKS_LAYOUT = 300
const DISTANCIA_ENLACE = 30
const CARGA = -40
/** Radio (m) de la esfera que ocupa el grafo alrededor del usuario. */
export const RADIO_MUNDO = 4
/** Burbuja vacía alrededor de los ojos: sin ella los hubs de rama (≈80 tareas cada uno) caen en la cara. */
export const RADIO_LIBRE = 1
export const ALTURA_OJOS = 1.6

function radioMaximo(nodos: readonly NodoSimulacion[]): number {
  const radios = nodos.map(({ x = 0, y = 0, z = 0 }) => Math.hypot(x, y, z))
  return Math.max(1, ...radios)
}

export function calcularLayout(
  grafo: Grafo,
  ticks: number = TICKS_LAYOUT,
): ReadonlyMap<string, Posicion> {
  // d3 escribe x/y/z en estos objetos: son copias que nacen y mueren acá, el grafo de entrada no se toca.
  const nodosSimulacion: NodoSimulacion[] = grafo.nodos.map(({ id }) => ({ id }))
  const enlaces = grafo.conexiones.map(({ origenId, destinoId }) => ({
    source: origenId,
    target: destinoId,
  }))

  forceSimulation(nodosSimulacion, DIMENSIONES)
    .force(
      'enlace',
      forceLink(enlaces)
        .id(({ id }) => id)
        .distance(DISTANCIA_ENLACE),
    )
    .force('carga', forceManyBody().strength(CARGA))
    .force('centro', forceCenter(0, 0, 0))
    .stop()
    .tick(ticks)

  // Cada nodo conserva su dirección; su distancia se lleva de [0, máximo] a [RADIO_LIBRE, RADIO_MUNDO].
  const maximo = radioMaximo(nodosSimulacion)
  return new Map(
    nodosSimulacion.map(({ id, x = 0, y = 0, z = 0 }) => {
      const radio = Math.hypot(x, y, z)
      const estaEnElCentro = radio === 0
      const radioMundo = RADIO_LIBRE + (RADIO_MUNDO - RADIO_LIBRE) * (radio / maximo)
      const escala = estaEnElCentro ? 0 : radioMundo / radio
      const posicion = estaEnElCentro
        ? { x: 0, y: ALTURA_OJOS, z: -RADIO_LIBRE }
        : { x: x * escala, y: y * escala + ALTURA_OJOS, z: z * escala }
      return [id, posicion]
    }),
  )
}
