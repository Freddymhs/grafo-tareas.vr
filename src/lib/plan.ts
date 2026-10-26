// Lo que la cara plan dibuja sobre cada pieza (Freddy, 2026-10-26): su número dentro del carril y una pelotita chica por
// cada OTRO carril que espera, con el número de la tarjeta que espera ahí. Todo lo calcula la API (`GET /derivado/plan`:
// `orden` y `pelotitas`); acá solo se pasa a lo que dibuja la escena. Puro.
import type { CarrilDto } from './api/generado/modelos'
import type { Grafo } from './dominio'

export interface MarcaDelPlan {
  /** Su lugar en la cadena de su carril: 1 = no espera a nada de su carril. */
  readonly orden: number
  /** Cada otro carril que espera: su color y el número de la tarjeta de esa línea («espera al 1 verde»). */
  readonly esperas: readonly Espera[]
}

export interface Espera {
  readonly color: string
  readonly numero: number
}

export function marcasDelPlan(carriles: readonly CarrilDto[]): ReadonlyMap<string, MarcaDelPlan> {
  return new Map(
    carriles.flatMap(({ titulo, nodos }) =>
      nodos.map(({ id, orden, pelotitas }) => {
        const esperas = pelotitas.flatMap(({ carril, color, espera }) =>
          carril !== titulo && espera !== null ? [{ color, numero: espera }] : [],
        )
        return [id, { orden, esperas }] as const
      }),
    ),
  )
}

/**
 * En la cara plan, una pieza ya tomada lleva su tarjeta `[<task>]` y, hasta que tenga su FASE, la VR la marca como PBI a
 * medias: morada y grande. Ese aviso es del trabajo; en el plan tapaba la línea («se ve morado, se ve gigante… ya no lo
 * entiendo», Freddy, 2026-10-26). Acá las piezas con número se ven como lo que son en el plan: una pieza de su línea.
 */
export function sinAvisoDePbi(grafo: Grafo, marcas: ReadonlyMap<string, MarcaDelPlan>): Grafo {
  if (marcas.size === 0) return grafo
  return {
    ...grafo,
    nodos: grafo.nodos.map((nodo) => {
      if (!marcas.has(nodo.id) || nodo.pbi === undefined) return nodo
      return { ...nodo, pbi: undefined }
    }),
  }
}
