// El lente «hoy» (Freddy, 2026-10-21): lo que puso en AHORA de Herdr, en su orden, y lo que lo frena. La VR se mira de
// noche, antes de cerrar la jornada: ¿qué quedó colgando de lo de hoy? El orden lo arma él a mano en Herdr y llega como
// `hoy:<n>` (`PUT /nodos/orden-del-dia`); acá solo se muestra, en la leyenda y no sobre los nodos. Puro.
import { EstadoNodo, TipoConexion, TipoNodo, type Nodo } from './dominio'
import { taskDe } from './pbi'
import { textoVisible } from './texto-visible'

/** Las que frenan al origen mientras el destino siga abierto: las mismas tres de la API (`CONEXIONES_BLOQUEANTES`). */
const FRENAN: ReadonlySet<TipoConexion> = new Set([
  TipoConexion.DEPENDE_DE,
  TipoConexion.ESPERA_RESPUESTA_DE,
  TipoConexion.BLOQUEADA_POR,
])
/** Cuatro o cinco títulos en una línea de la leyenda: cada uno lo justo para reconocerlo. */
const LARGO_TITULO_DEL_DIA = 32
const NADA_HOY = 'nada de hoy en esta HU'

interface Hilo {
  readonly origenId: string
  readonly destinoId: string
  readonly tipo: TipoConexion
}

/** Las tarjetas del día, de la primera a la última. */
export function delDia(nodos: readonly Nodo[]): readonly Nodo[] {
  const delDiaSinOrden = nodos.filter(({ hoy }) => hoy !== undefined)
  return [...delDiaSinOrden].sort((a, b) => (a.hoy ?? 0) - (b.hoy ?? 0))
}

/**
 * Lo que el lente deja encendido: cada tarjeta del día y su FASE (las dos mitades del PBI), la HU como ancla, y lo
 * abierto que frena a cualquiera de ellas. Sus hilos se encienden solos (`hilosDelFiltro`): se ve a quién espera.
 */
export function encendidosDelDia(
  nodos: readonly Nodo[],
  conexiones: readonly Hilo[],
): ReadonlySet<string> {
  const tasksDelDia = new Set(delDia(nodos).map(taskDe))
  const esDelDia = (nodo: Nodo) => {
    const task = taskDe(nodo)
    return nodo.hoy !== undefined || (task !== undefined && tasksDelDia.has(task))
  }
  const mitades = new Set(nodos.filter(esDelDia).map(({ id }) => id))
  const abiertos = new Set(
    nodos.filter(({ estado }) => estado !== EstadoNodo.CERRADO).map(({ id }) => id),
  )
  const frenos = conexiones
    .filter(
      ({ origenId, destinoId, tipo }) =>
        FRENAN.has(tipo) && mitades.has(origenId) && abiertos.has(destinoId),
    )
    .map(({ destinoId }) => destinoId)
  const historias = nodos.filter(({ tipo }) => tipo === TipoNodo.HISTORIA).map(({ id }) => id)
  return new Set([...historias, ...mitades, ...frenos])
}

/** La segunda línea de la leyenda: cada tarjeta con su lugar del día. Un hueco en los números = está en otra HU. */
export function textoDelDia(nodos: readonly Nodo[]): readonly string[] {
  const tarjetas = delDia(nodos)
  if (tarjetas.length === 0) return [NADA_HOY]
  return tarjetas.map(({ hoy, titulo }) => `${hoy} · ${textoVisible(titulo, LARGO_TITULO_DEL_DIA)}`)
}
