// Qué posiciones nuevas se mandan a `PUT /nodos/posiciones`: las de los nodos cuyo hogar es esta página. Un nodo de otra
// página guarda la posición de la suya, y un fantasma (FASE 24, D9) la de su proyecto: aquí solo se ubica para verlo.
import type { Posicion } from './dominio'

export interface PosicionAGuardar extends Posicion {
  readonly id: string
}

export function posicionesAGuardar(
  nuevas: ReadonlyMap<string, Posicion>,
  hogar: ReadonlyMap<string, string>,
  paginaId: string,
  fantasmas: ReadonlySet<string>,
): PosicionAGuardar[] {
  return [...nuevas]
    .filter(([id]) => hogar.get(id) === paginaId && !fantasmas.has(id))
    .map(([id, { x, y, z }]) => ({ id, x, y, z }))
}
