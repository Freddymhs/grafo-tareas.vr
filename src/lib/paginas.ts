// Una HU a la vez (FASE 15): qué hay en cada página lo decide la API (`GET /derivado/paginas`); acá solo se recorta el
// grafo a esa página, se cambia de una a otra y se sabe de qué página es la posición guardada de cada nodo. Puro.
import { TipoConexion, TipoNodo, type Grafo } from './dominio'

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

/**
 * Los nodos sin padre (FASE 15): la HU, que es la raíz de su árbol, y lo suelto. Llevan su fecha a la vista; lo que
 * cuelga de algo no (su lugar en el árbol ya da el contexto, y la fecha en todo sería ruido). Pertenecer a una rama no
 * es tener padre: la rama es el color. Se calcula sobre el grafo ENTERO: el padre puede estar en otra página.
 */
export function sinPadre(grafo: Grafo): ReadonlySet<string> {
  const tipoDe = new Map(grafo.nodos.map(({ id, tipo }) => [id, tipo]))
  const conPadre = new Set(
    grafo.conexiones
      .filter(
        ({ tipo, destinoId }) =>
          tipo === TipoConexion.PERTENECE_A && tipoDe.get(destinoId) !== TipoNodo.RAMA,
      )
      .map(({ origenId }) => origenId),
  )
  return new Set(grafo.nodos.map(({ id }) => id).filter((id) => !conPadre.has(id)))
}

const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

/** «14-oct»: como Freddy fecha sus tarjetas. En UTC, para que dé lo mismo en el visor y en los tests. */
export function fechaCorta(iso: string): string {
  const fecha = new Date(iso)
  return `${String(fecha.getUTCDate()).padStart(2, '0')}-${MESES[fecha.getUTCMonth()]}`
}

/** Un título que ya empieza con su fecha, como Freddy anota muchas («13-sep · …», «1-oct · …»). */
const EMPIEZA_CON_FECHA = /^\d{1,2}-(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i

/** La etiqueta de una tarea sin padre: su fecha adelante, salvo que el título ya la traiga. */
export function textoConFecha(titulo: string, iso: string): string {
  return EMPIEZA_CON_FECHA.test(titulo.trim()) ? titulo : `${fechaCorta(iso)} · ${titulo}`
}
