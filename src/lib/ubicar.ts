// Dónde va un nodo que no tiene posición guardada, sin mover a los que sí tienen (FASE 6 tarea 2: "recargar dos
// veces da el mismo mapa"). El layout corre solo con el mapa vacío (o `?reordenar`); después cada nodo nuevo cae en
// la pantalla curva (FASE 15) entre sus vecinos ya ubicados o, si no tiene, detrás con las sueltas. Determinista: el
// lugar sale de un hash del id, nunca de Math.random.
import type { Grafo, Posicion } from './dominio'
import { hashUnitario } from './hash'
import { ALTO_MEDIO, ALTURA_OJOS, RADIO_PANORAMA, anguloDe, enCilindro } from './layout'

/** Cuánto se separa un nodo nuevo del centro de sus vecinos (m): lo justo para no taparlos. */
export const SEPARACION_VECINO = 0.25
/** Un nuevo sin vecinos cae en este arco detrás (rad), donde la pantalla agrupa las sueltas. */
const ARCO_NUEVAS_SUELTAS = Math.PI / 6

function vecinosDe(grafo: Grafo): ReadonlyMap<string, readonly string[]> {
  const vecinos = new Map<string, string[]>()
  grafo.conexiones.forEach(({ origenId, destinoId }) => {
    vecinos.set(origenId, [...(vecinos.get(origenId) ?? []), destinoId])
    vecinos.set(destinoId, [...(vecinos.get(destinoId) ?? []), origenId])
  })
  return vecinos
}

/** El radio de la pantalla guardada (la mediana: un nodo movido a mano no la cambia). */
function radioDelMapa(guardadas: ReadonlyMap<string, Posicion>): number {
  const radios = [...guardadas.values()]
    .map(({ x, z }) => Math.hypot(x, z))
    .toSorted((a, b) => a - b)
  return radios.length === 0 ? RADIO_PANORAMA : radios[Math.floor(radios.length / 2)]
}

/** Ángulo medio de varios puntos de la pantalla: promedio de direcciones, sin el salto de ±π detrás. */
function anguloMedio(puntos: readonly Posicion[]): number {
  const seno = puntos.reduce((suma, p) => suma + Math.sin(anguloDe(p)), 0)
  const coseno = puntos.reduce((suma, p) => suma + Math.cos(anguloDe(p)), 0)
  return Math.atan2(seno, coseno)
}

const enLaBanda = (altura: number) =>
  Math.min(ALTURA_OJOS + ALTO_MEDIO, Math.max(ALTURA_OJOS - ALTO_MEDIO, altura))

/** Un número en [−1, 1), fijo por id y sal. */
const desvio = (id: string, sal: string) => 2 * hashUnitario(id, sal) - 1

function ubicarNuevo(id: string, ubicados: readonly Posicion[], radio: number): Posicion {
  if (ubicados.length === 0) {
    const angulo = Math.PI + (desvio(id, 'angulo') * ARCO_NUEVAS_SUELTAS) / 2
    return enCilindro(angulo, enLaBanda(ALTURA_OJOS + desvio(id, 'altura') * ALTO_MEDIO), radio)
  }
  const alturaMedia = ubicados.reduce((suma, { y }) => suma + y, 0) / ubicados.length
  const angulo = anguloMedio(ubicados) + (desvio(id, 'angulo') * SEPARACION_VECINO) / radio
  const altura = enLaBanda(alturaMedia + desvio(id, 'altura') * SEPARACION_VECINO)
  return enCilindro(angulo, altura, radio)
}

export interface Ubicacion {
  /** Todas las posiciones del mapa: las guardadas, intactas, más las nuevas. */
  readonly posiciones: ReadonlyMap<string, Posicion>
  /** Solo las que hay que guardar en la API. */
  readonly nuevas: ReadonlyMap<string, Posicion>
}

export function ubicarFaltantes(grafo: Grafo, guardadas: ReadonlyMap<string, Posicion>): Ubicacion {
  const vecinos = vecinosDe(grafo)
  const radio = radioDelMapa(guardadas)
  const nuevas = new Map(
    grafo.nodos
      .filter(({ id }) => !guardadas.has(id))
      .map(({ id }) => {
        const ubicados = (vecinos.get(id) ?? [])
          .map((vecino) => guardadas.get(vecino))
          .filter((p): p is Posicion => p !== undefined)
        return [id, ubicarNuevo(id, ubicados, radio)] as const
      }),
  )
  return { posiciones: new Map([...guardadas, ...nuevas]), nuevas }
}
