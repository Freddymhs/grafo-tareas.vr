// Lo que la cara plan dibuja sobre cada pieza (Freddy, 2026-10-26): su número dentro del carril y una pelotita chica por
// cada OTRO carril que espera, con el número de la tarjeta que espera ahí. Todo lo calcula la API (`GET /derivado/plan`:
// `orden` y `pelotitas`); acá solo se pasa a lo que dibuja la escena. Puro.
import type { CarrilDto } from './api/generado/modelos'
import { Cara, type Grafo } from './dominio'

export interface MarcaDelPlan {
  /** Su lugar en la cadena de su carril: 1 = no espera a nada de su carril. */
  readonly orden: number
  /** Cada otro carril que espera: su color y el número de la tarjeta de esa línea («espera al 1 verde»). */
  readonly esperas: readonly Espera[]
  /** Ya tomada: la API la manda en la cara de trabajo. En el plan sigue en su línea, pero apagada. */
  readonly tomada: boolean
}

export interface Espera {
  readonly color: string
  readonly numero: number
}

export function marcasDelPlan(carriles: readonly CarrilDto[]): ReadonlyMap<string, MarcaDelPlan> {
  return new Map(
    carriles.flatMap(({ titulo, nodos }) =>
      nodos.map(({ id, orden, pelotitas, cara }) => {
        const esperas = pelotitas.flatMap(({ carril, color, espera }) =>
          carril !== titulo && espera !== null ? [{ color, numero: espera }] : [],
        )
        return [id, { orden, esperas, tomada: cara === Cara.REAL }] as const
      }),
    ),
  )
}

/**
 * Las piezas del plan como se ven en el plan. Una ya tomada lleva su tarjeta `[<task>]` y, hasta que tenga su FASE, la VR
 * la marcaría PBI a medias: morada y grande; ese aviso es del trabajo y acá tapaba la línea («se ve morado, se ve
 * gigante… ya no lo entiendo», Freddy, 26-10). Acá es una pieza de su línea, marcada `tomada`: sin esfera y fuera de lo
 * pendiente.
 */
export function vistaDelPlan(grafo: Grafo, marcas: ReadonlyMap<string, MarcaDelPlan>): Grafo {
  if (marcas.size === 0) return grafo
  return {
    ...grafo,
    nodos: grafo.nodos.map((nodo) => {
      const marca = marcas.get(nodo.id)
      if (!marca) return nodo
      return { ...nodo, pbi: undefined, ...(marca.tomada ? { tomada: true } : {}) }
    }),
  }
}
