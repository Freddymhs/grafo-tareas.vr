// Una HU a la vez (FASE 15): qué hay en cada página lo decide la API (`GET /derivado/paginas`); acá solo se recorta el
// grafo a esa página, se cambia de una a otra y se sabe de qué página es la posición guardada de cada nodo. Cada HU es
// un libro de dos caras (FASE 17): la API dice de qué libro y de qué cara es cada página; acá se agrupan. Puro.
import { Cara, TipoConexion, TipoNodo, type Grafo } from './dominio'

/** La siguiente (`1`) o la anterior (`-1`), dando la vuelta: con dos HU, X alterna entre ellas. */
export function paginaVecina(indice: number, paso: 1 | -1, total: number): number {
  if (total === 0) return 0
  return (((indice + paso) % total) + total) % total
}

interface ConCara {
  readonly id: string
  readonly libro: string
  readonly cara: Cara
}

export interface Libro<P extends ConCara> {
  readonly id: string
  readonly real: P | null
  readonly plan: P | null
}

/** Las páginas agrupadas por libro, en el orden en que las da la API. */
export function librosDe<P extends ConCara>(paginas: readonly P[]): Libro<P>[] {
  const ids = [...new Set(paginas.map(({ libro }) => libro))]
  return ids.map((id) => {
    const deLaCara = (cara: Cara) =>
      paginas.find((pagina) => pagina.libro === id && pagina.cara === cara) ?? null
    return { id, real: deLaCara(Cara.REAL), plan: deLaCara(Cara.PLAN) }
  })
}

/** La cara pedida; si el libro no la tiene, la que tiene (girar la pelota pide lo real, y todo libro tiene alguna). */
export function caraVisible<P extends ConCara>(libro: Libro<P>, cara: Cara): P | null {
  const pedida = cara === Cara.PLAN ? libro.plan : libro.real
  return pedida ?? libro.real ?? libro.plan
}

/** A qué cara lleva dar vuelta la hoja desde la que se ve; `null` si el libro tiene una sola. */
export function otraCara<P extends ConCara>(libro: Libro<P>, cara: Cara): Cara | null {
  const visible = caraVisible(libro, cara)?.cara
  const otra = visible === Cara.PLAN ? Cara.REAL : Cara.PLAN
  return caraVisible(libro, otra)?.cara === otra ? otra : null
}

/** Las ramas que colorean una página: a las que PERTENECE_A algo de ella. La leyenda nombra solo ésas (Freddy, 2026-10-18). */
export function ramasDePagina(grafo: Grafo, ids: readonly string[]): ReadonlySet<string> {
  const enLaPagina = new Set(ids)
  const esRama = new Set(
    grafo.nodos.filter(({ tipo }) => tipo === TipoNodo.RAMA).map(({ id }) => id),
  )
  return new Set(
    grafo.conexiones
      .filter(
        ({ origenId, destinoId, tipo }) =>
          tipo === TipoConexion.PERTENECE_A && enLaPagina.has(origenId) && esRama.has(destinoId),
      )
      .map(({ destinoId }) => destinoId),
  )
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
