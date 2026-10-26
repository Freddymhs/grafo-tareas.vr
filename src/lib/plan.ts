// Lo que la cara plan dibuja sobre cada pieza (Freddy, 2026-10-26): su número dentro del carril y una pelotita chica por
// cada OTRO carril que espera. Los dos los calcula la API (`GET /derivado/plan`: `orden` y `pelotitas`); acá solo se
// pasan a lo que dibuja la escena. Puro.
import type { CarrilDto } from './api/generado/modelos'

export interface MarcaDelPlan {
  /** Su lugar en la cadena de su carril: 1 = no espera a nada de su carril. */
  readonly orden: number
  /** El color de cada otro carril que espera («espera a esa línea»). */
  readonly esperas: readonly string[]
}

export function marcasDelPlan(carriles: readonly CarrilDto[]): ReadonlyMap<string, MarcaDelPlan> {
  return new Map(
    carriles.flatMap(({ titulo, nodos }) =>
      nodos.map(({ id, orden, pelotitas }) => {
        const esperas = pelotitas
          .filter(({ carril }) => carril !== titulo)
          .map(({ color }) => color)
        return [id, { orden, esperas }] as const
      }),
    ),
  )
}
