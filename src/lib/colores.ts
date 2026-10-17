// De qué color se pinta cada nodo: la rama a la que pertenece (los círculos de Freddy), y colores fijos para
// personas y dudas, que son las que bloquean.

import {
  COLOR_DUDA,
  COLOR_FASE,
  COLOR_HISTORIA,
  COLOR_PERSONA,
  COLOR_SIN_RAMA,
} from './constants/grafo'
import { TipoConexion, TipoNodo, type Grafo, type Nodo } from './dominio'

function colorDe(nodo: Nodo, primeraRama: ReadonlyMap<string, string>): string {
  switch (nodo.tipo) {
    case TipoNodo.RAMA:
      return nodo.color ?? COLOR_SIN_RAMA
    case TipoNodo.PERSONA:
      return COLOR_PERSONA
    case TipoNodo.DUDA:
      return COLOR_DUDA
    case TipoNodo.HISTORIA:
      return COLOR_HISTORIA
    case TipoNodo.FASE:
      return COLOR_FASE
    default:
      return primeraRama.get(nodo.id) ?? COLOR_SIN_RAMA
  }
}

export function coloresPorNodo(grafo: Grafo): ReadonlyMap<string, string> {
  const colorRama = new Map(
    grafo.nodos.filter((n) => n.color !== undefined).map((n) => [n.id, n.color ?? '']),
  )
  // Solo cuenta pertenecer a una RAMA (lo que tiene color): una tarjeta también PERTENECE_A su FASE y su HU
  // (FASE 13), y si eso contara, el orden de las conexiones la dejaba gris.
  const aRamas = grafo.conexiones.filter(
    ({ tipo, destinoId }) => tipo === TipoConexion.PERTENECE_A && colorRama.has(destinoId),
  )
  // La primera rama declarada gana: un nodo de dos ramas se ve de la primera y se une a la otra por la arista.
  const primeraRama = new Map(
    aRamas
      .toReversed()
      .map(({ origenId, destinoId }) => [origenId, colorRama.get(destinoId) ?? COLOR_SIN_RAMA]),
  )
  return new Map(grafo.nodos.map((nodo) => [nodo.id, colorDe(nodo, primeraRama)]))
}
