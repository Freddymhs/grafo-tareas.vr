// De qué color se pinta cada nodo: la rama a la que pertenece (los círculos de Freddy), y colores fijos para lo que
// es otra cosa que una tarea: personas y dudas, que bloquean; la HU; el PBI (morado, `lib/pbi.ts`) y lo «para decir».

import {
  COLOR_DUDA,
  COLOR_FONDO,
  COLOR_FASE,
  COLOR_HISTORIA,
  COLOR_PARA_DECIR,
  COLOR_PBI_A_MEDIAS,
  COLOR_PERSONA,
  COLOR_SIN_RAMA,
} from './constants/grafo'
import { Pbi, TipoConexion, TipoNodo, type Grafo, type Nodo } from './dominio'
import { esPbiIncompleto } from './pbi'

function colorDe(nodo: Nodo, primeraRama: ReadonlyMap<string, string>): string {
  // Un PBI es morado aunque su tarjeta esté en un carril: «es un PBI» pesa más que la zona de código.
  if (esPbiIncompleto(nodo.pbi)) return COLOR_PBI_A_MEDIAS
  if (nodo.pbi === Pbi.ENTERO) return COLOR_FASE
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
    case TipoNodo.DAILY_ITEM:
      return COLOR_PARA_DECIR
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

/** Cuánto se acerca al fondo lo que queda fuera de la selección: se ve que está, pero no compite. */
const APAGADO = 0.75

const canales = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
const aHex = (valores: readonly number[]) =>
  `#${valores.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

/**
 * Lo que queda fuera de lo iluminado —la familia de una selección (FASE 15) o lo pendiente del filtro (FASE 17)—: su
 * color, hundido hacia el fondo. Un tenue a medias no alcanzaba: obligaba a buscar (Freddy en el visor, 2026-10-18).
 */
export function colorApagado(hex: string): string {
  const fondo = canales(COLOR_FONDO)
  return aHex(canales(hex).map((valor, i) => valor + (fondo[i] - valor) * APAGADO))
}

/** El texto que se lee sobre un color: oscuro o blanco, el de más contraste (WCAG). */
const TEXTO_OSCURO = '#020617'
const TEXTO_CLARO = '#ffffff'
const luminancia = (hex: string) => {
  const [r, g, b] = canales(hex).map((valor) => {
    const c = valor / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contraste = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

/** El número dentro de la pelotita del plan (Freddy, 2026-10-26): legible sobre el color de cualquier carril. */
export function colorDeTextoSobre(fondo: string): string {
  const deFondo = luminancia(fondo)
  return contraste(deFondo, luminancia(TEXTO_OSCURO)) >= contraste(deFondo, luminancia(TEXTO_CLARO))
    ? TEXTO_OSCURO
    : TEXTO_CLARO
}
