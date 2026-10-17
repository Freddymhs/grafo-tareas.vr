// Dónde va un nodo que no tiene posición guardada, sin mover a los que sí tienen (FASE 6 tarea 2: "recargar dos
// veces da el mismo mapa"). El layout de fuerzas corre solo la primera vez, con el mapa vacío; después cada nodo
// nuevo cae junto a sus vecinos ya ubicados, o, si no tiene, en un punto fijo de la esfera. Determinista: el
// lugar sale de un hash del id, nunca de Math.random.
import type { Grafo, Posicion } from './dominio'
import { ALTURA_OJOS, RADIO_LIBRE, RADIO_MUNDO } from './layout'

/** Cuánto se separa un nodo nuevo del centro de sus vecinos (m): lo justo para no taparlos. */
export const SEPARACION_VECINO = 0.25
const RADIO_SIN_VECINOS = (RADIO_LIBRE + RADIO_MUNDO) / 2
const FNV_BASE = 0x811c9dc5
const FNV_PRIMO = 0x01000193
const MAXIMO_32 = 0x1_0000_0000

/** FNV-1a de 32 bits llevado a [0, 1): el mismo id da siempre el mismo número. */
export function hashUnitario(texto: string, sal = ''): number {
  const bytes = new TextEncoder().encode(`${sal}:${texto}`)
  const hash = bytes.reduce((h, byte) => Math.imul(h ^ byte, FNV_PRIMO) >>> 0, FNV_BASE)
  return hash / MAXIMO_32
}

/** Una dirección de la esfera unidad, fija por id. */
function direccion(id: string): Posicion {
  const theta = 2 * Math.PI * hashUnitario(id, 'theta')
  const cosPhi = 2 * hashUnitario(id, 'phi') - 1
  const senPhi = Math.sqrt(1 - cosPhi * cosPhi)
  return { x: senPhi * Math.cos(theta), y: cosPhi, z: senPhi * Math.sin(theta) }
}

/** Lleva un punto a la cáscara [RADIO_LIBRE, RADIO_MUNDO] alrededor de los ojos. */
function dentroDelMundo({ x, y, z }: Posicion): Posicion {
  const relativo = { x, y: y - ALTURA_OJOS, z }
  const radio = Math.hypot(relativo.x, relativo.y, relativo.z)
  if (radio === 0) return { x: 0, y: ALTURA_OJOS, z: -RADIO_LIBRE }
  const acotado = Math.min(RADIO_MUNDO, Math.max(RADIO_LIBRE, radio))
  const escala = acotado / radio
  return { x: relativo.x * escala, y: relativo.y * escala + ALTURA_OJOS, z: relativo.z * escala }
}

function vecinosDe(grafo: Grafo): ReadonlyMap<string, readonly string[]> {
  const vecinos = new Map<string, string[]>()
  grafo.conexiones.forEach(({ origenId, destinoId }) => {
    vecinos.set(origenId, [...(vecinos.get(origenId) ?? []), destinoId])
    vecinos.set(destinoId, [...(vecinos.get(destinoId) ?? []), origenId])
  })
  return vecinos
}

function centro(puntos: readonly Posicion[]): Posicion {
  const suma = puntos.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y, z: a.z + p.z }), {
    x: 0,
    y: 0,
    z: 0,
  })
  return { x: suma.x / puntos.length, y: suma.y / puntos.length, z: suma.z / puntos.length }
}

export interface Ubicacion {
  /** Todas las posiciones del mapa: las guardadas, intactas, más las nuevas. */
  readonly posiciones: ReadonlyMap<string, Posicion>
  /** Solo las que hay que guardar en la API. */
  readonly nuevas: ReadonlyMap<string, Posicion>
}

export function ubicarFaltantes(grafo: Grafo, guardadas: ReadonlyMap<string, Posicion>): Ubicacion {
  const vecinos = vecinosDe(grafo)
  const nuevas = new Map<string, Posicion>()
  grafo.nodos
    .filter(({ id }) => !guardadas.has(id))
    .forEach(({ id }) => {
      const ubicados = (vecinos.get(id) ?? [])
        .map((vecino) => guardadas.get(vecino))
        .filter((p): p is Posicion => p !== undefined)
      const d = direccion(id)
      const posicion =
        ubicados.length > 0
          ? (() => {
              const c = centro(ubicados)
              return {
                x: c.x + d.x * SEPARACION_VECINO,
                y: c.y + d.y * SEPARACION_VECINO,
                z: c.z + d.z * SEPARACION_VECINO,
              }
            })()
          : {
              x: d.x * RADIO_SIN_VECINOS,
              y: d.y * RADIO_SIN_VECINOS + ALTURA_OJOS,
              z: d.z * RADIO_SIN_VECINOS,
            }
      nuevas.set(id, dentroDelMundo(posicion))
    })
  return { posiciones: new Map([...guardadas, ...nuevas]), nuevas }
}
