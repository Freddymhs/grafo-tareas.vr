// Lo que la cara plan dibuja sobre cada pieza (Freddy, 2026-10-26): su número dentro del carril y una pelotita chica por
// cada OTRO carril que espera, con el número de la tarjeta que espera ahí. Todo lo calcula la API (`GET /derivado/plan`:
// `orden` y `pelotitas`); acá solo se pasa a lo que dibuja la escena. Puro.
import type { CarrilDto } from './api/generado/modelos'

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
