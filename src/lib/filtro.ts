// El filtro de la VR (FASE 17, idea de Freddy): con la mano derecha muestra un número y la página cambia de lente. Hay
// dos: «pendiente», que apaga lo resuelto (lo mergeado y lo cerrado) como se apaga lo que queda fuera de una selección,
// para que salte lo que quedó colgando; y «pendiente sin trámites», que además apaga los trámites de cierre (URL commit,
// evidencias, wiki: Freddy, 2026-10-18, «más un estorbo y carga cognitiva que datos valiosos»); y «lo que frena», que
// deja solo lo que destraba al resto (Freddy en el plan de la HU 20379, 18-10: «elijo filtro 4 y veo las dudas que tengo
// que abarcar hoy»). Qué está mergeado, cerrado o es trámite lo dice la API; acá solo se elige qué se apaga. Puro.
import { EstadoNodo, TipoConexion, TipoNodo, type Nodo } from './dominio'

export const Filtro = {
  TODO: 'todo',
  PENDIENTE: 'pendiente',
  SIN_TRAMITES: 'sin-tramites',
  LO_QUE_FRENA: 'lo-que-frena',
} as const
export type Filtro = (typeof Filtro)[keyof typeof Filtro]

/**
 * Se cuenta de menor a mayor (Freddy, 2026-10-18): 1 = ver todo (el filtro apagado, por defecto), 2 = pendiente, 3 =
 * pendiente sin trámites, 4 = lo que frena; el 5 queda para lo que venga. El pellizco de Meta no es un 1
 * (`numeroDeLaMano`). Mostrar otra vez el número del filtro puesto también lo apaga, y el botón B los recorre. La mano
 * abierta (5) es la de descanso: como «por defecto» se dispararía sin querer.
 */
const POR_NUMERO: Readonly<Record<number, Filtro>> = {
  1: Filtro.TODO,
  2: Filtro.PENDIENTE,
  3: Filtro.SIN_TRAMITES,
  4: Filtro.LO_QUE_FRENA,
}
/** El botón B del control derecho recorre los filtros en este orden y vuelve a empezar. */
const ORDEN: readonly Filtro[] = [
  Filtro.TODO,
  Filtro.PENDIENTE,
  Filtro.SIN_TRAMITES,
  Filtro.LO_QUE_FRENA,
]
/** Lo que dice la leyenda mientras un filtro está puesto: qué se ve y con qué dedos se sale. */
export const TEXTO_DEL_FILTRO: Readonly<Record<Filtro, string | null>> = {
  [Filtro.TODO]: null,
  [Filtro.PENDIENTE]: 'filtro 2 · pendiente (1 = todo)',
  [Filtro.SIN_TRAMITES]: 'filtro 3 · pendiente sin trámites (1 = todo)',
  [Filtro.LO_QUE_FRENA]: 'filtro 4 · lo que frena (1 = todo)',
}
/**
 * Lo que frena: lo que hay que contestar, a quién y lo que hay que decir —si se destraba, avanza lo demás— y la HU, que
 * es el ancla de la página. Sus hilos hacia lo que bloquean siguen encendidos (`hilosDelFiltro`): se ve qué destraba.
 */
const LO_QUE_FRENA: ReadonlySet<TipoNodo> = new Set([
  TipoNodo.DUDA,
  TipoNodo.PERSONA,
  TipoNodo.DAILY_ITEM,
  TipoNodo.HISTORIA,
])

/** El filtro que pide mostrar `numero` con el filtro `actual` puesto: el mismo número lo apaga; `null`, ninguno. */
export function filtroAlMostrar(numero: number, actual: Filtro): Filtro | null {
  const pedido = POR_NUMERO[numero]
  if (pedido === undefined) return null
  return pedido === actual ? Filtro.TODO : pedido
}

export function filtroDeTexto(texto: string | null): Filtro {
  return ORDEN.find((filtro) => filtro === texto) ?? Filtro.TODO
}

export function siguienteFiltro(actual: Filtro): Filtro {
  return ORDEN[(ORDEN.indexOf(actual) + 1) % ORDEN.length]
}

/** Lo que «pendiente» deja encendido: lo que ni se mergeó ni se cerró. */
export function pendientes(nodos: readonly Nodo[]): ReadonlySet<string> {
  return new Set(
    nodos
      .filter(({ mergeada, estado }) => !mergeada && estado !== EstadoNodo.CERRADO)
      .map(({ id }) => id),
  )
}

/** Lo que cada filtro deja encendido; `null` con «todo»: no se apaga nada. */
export function encendidosPor(filtro: Filtro, nodos: readonly Nodo[]): ReadonlySet<string> | null {
  if (filtro === Filtro.TODO) return null
  if (filtro === Filtro.PENDIENTE) return pendientes(nodos)
  if (filtro === Filtro.LO_QUE_FRENA)
    return pendientes(nodos.filter(({ tipo }) => LO_QUE_FRENA.has(tipo)))
  return pendientes(nodos.filter(({ tramite }) => !tramite))
}

interface Hilo {
  readonly id: string
  readonly origenId: string
  readonly destinoId: string
  readonly tipo: TipoConexion
}

/**
 * Los hilos que el filtro deja encendidos: los que llevan a algo pendiente (Freddy, 2026-10-18). Uno de pertenencia
 * (hija → FASE → HU) brilla si debajo de la hija queda algo pendiente: la FASE 20 con una hija abierta sigue unida a su
 * HU; la FASE 19, con todo cerrado, no. Uno de dependencia brilla si sus dos puntas siguen pendientes: un bloqueo de algo
 * ya cerrado no importa.
 */
export function hilosDelFiltro(
  conexiones: readonly Hilo[],
  pendientes: ReadonlySet<string>,
): ReadonlySet<string> {
  const pertenencias = conexiones.filter(({ tipo }) => tipo === TipoConexion.PERTENECE_A)
  // Lo que tiene algo pendiente debajo crece hasta que nada nuevo entra: es el estado del recorrido. Un ciclo no lo cuelga.
  const conPendiente = new Set(pendientes)
  const pendientesDeAbajo = [...pendientes]
  while (pendientesDeAbajo.length > 0) {
    const hija = pendientesDeAbajo.pop()
    pertenencias
      .filter(({ origenId, destinoId }) => origenId === hija && !conPendiente.has(destinoId))
      .forEach(({ destinoId }) => {
        conPendiente.add(destinoId)
        pendientesDeAbajo.push(destinoId)
      })
  }
  const encendido = ({ origenId, destinoId, tipo }: Hilo) =>
    tipo === TipoConexion.PERTENECE_A
      ? conPendiente.has(origenId)
      : pendientes.has(origenId) && pendientes.has(destinoId)
  return new Set(conexiones.filter(encendido).map(({ id }) => id))
}
