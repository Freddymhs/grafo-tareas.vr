// De qué color se pinta cada nodo: la rama a la que pertenece (los círculos de Freddy), y colores fijos para
// personas y dudas, que son las que bloquean.

import { COLOR_DUDA, COLOR_PERSONA, COLOR_SIN_RAMA } from './constants/grafo'
import { TipoConexion, TipoNodo, type Grafo, type Nodo } from './dominio'

function colorDe(nodo: Nodo, primeraRama: ReadonlyMap<string, string>): string {
  switch (nodo.tipo) {
    case TipoNodo.RAMA:
      return nodo.color ?? COLOR_SIN_RAMA
    case TipoNodo.PERSONA:
      return COLOR_PERSONA
    case TipoNodo.DUDA:
      return COLOR_DUDA
    default:
      return primeraRama.get(nodo.id) ?? COLOR_SIN_RAMA
  }
}

export function coloresPorNodo(grafo: Grafo): ReadonlyMap<string, string> {
  const colorRama = new Map(
    grafo.nodos.filter((n) => n.color !== undefined).map((n) => [n.id, n.color ?? '']),
  )
  const pertenencias = grafo.conexiones.filter(({ tipo }) => tipo === TipoConexion.PERTENECE_A)
  // La primera rama declarada gana: un nodo de dos ramas se ve de la primera y se une a la otra por la arista.
  const primeraRama = new Map(
    pertenencias
      .toReversed()
      .map(({ origenId, destinoId }) => [origenId, colorRama.get(destinoId) ?? COLOR_SIN_RAMA]),
  )
  return new Map(grafo.nodos.map((nodo) => [nodo.id, colorDe(nodo, primeraRama)]))
}
