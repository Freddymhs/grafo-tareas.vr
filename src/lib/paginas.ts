// Una HU a la vez (FASE 15): qué hay en cada página lo decide la API (`GET /derivado/paginas`); acá solo se recorta el
// grafo a esa página, se cambia de una a otra y se sabe de qué página es la posición guardada de cada nodo. Puro.
import type { Grafo } from './dominio'

/** La siguiente (`1`) o la anterior (`-1`), dando la vuelta: con dos HU, X alterna entre ellas. */
export function paginaVecina(indice: number, paso: 1 | -1, total: number): number {
  if (total === 0) return 0
  return (((indice + paso) % total) + total) % total
}

/** Los nodos de la página y las conexiones entre ellos: lo demás no se dibuja. */
export function grafoDePagina(grafo: Grafo, ids: readonly string[]): Grafo {
  const enLaPagina = new Set(ids)
  return {
    nodos: grafo.nodos.filter(({ id }) => enLaPagina.has(id)),
    conexiones: grafo.conexiones.filter(
      ({ origenId, destinoId }) => enLaPagina.has(origenId) && enLaPagina.has(destinoId),
    ),
  }
}

/**
 * De qué página es cada nodo: la primera que lo trae. Su posición guardada es la de esa página (C2); en otra página
 * (una persona que bloquea en dos HU) se ubica junto a sus vecinos sin pisarla.
 */
export function hogares(
  paginas: ReadonlyArray<{ readonly id: string; readonly nodos: readonly string[] }>,
): ReadonlyMap<string, string> {
  const hogar = new Map<string, string>()
  paginas.forEach(({ id, nodos }) =>
    nodos.filter((nodo) => !hogar.has(nodo)).forEach((nodo) => hogar.set(nodo, id)),
  )
  return hogar
}
