// El filtro de la VR (FASE 17, idea de Freddy): con la mano derecha muestra un número y la página cambia de lente. Hay
// dos: «pendiente», que apaga lo resuelto (lo mergeado y lo cerrado) como se apaga lo que queda fuera de una selección,
// para que salte lo que quedó colgando; y «pendiente sin trámites», que además apaga los trámites de cierre (URL commit,
// evidencias, wiki: Freddy, 2026-10-18, «más un estorbo y carga cognitiva que datos valiosos»). Qué está mergeado,
// cerrado o es trámite lo dice la API; acá solo se elige qué se apaga. Puro.
import { EstadoNodo, TipoConexion, type Nodo } from './dominio'

export const Filtro = {
  TODO: 'todo',
  PENDIENTE: 'pendiente',
  SIN_TRAMITES: 'sin-tramites',
} as const
export type Filtro = (typeof Filtro)[keyof typeof Filtro]

/**
 * Se cuenta de menor a mayor (Freddy, 2026-10-18): 2 = pendiente, 3 = pendiente sin trámites; 4 y 5 quedan para los
 * que vengan. El 1 ya no elige nada: el índice solo es la pose de apuntar con el rayo, y el visor la contaba como
 * «1 = todo» (Freddy en el visor, 2026-10-18). Ver todo (el filtro apagado, por defecto) es mostrar otra vez el número
 * del filtro puesto, o el botón B. La mano abierta (5) es la de descanso: como «por defecto» se dispararía sin querer.
 */
const POR_NUMERO: Readonly<Record<number, Filtro>> = {
  2: Filtro.PENDIENTE,
  3: Filtro.SIN_TRAMITES,
}
/** El botón B del control derecho recorre los filtros en este orden y vuelve a empezar. */
const ORDEN: readonly Filtro[] = [Filtro.TODO, Filtro.PENDIENTE, Filtro.SIN_TRAMITES]
/** Lo que dice la leyenda mientras un filtro está puesto: qué se ve y con qué dedos se sale. */
export const TEXTO_DEL_FILTRO: Readonly<Record<Filtro, string | null>> = {
  [Filtro.TODO]: null,
  [Filtro.PENDIENTE]: 'filtro 2 · pendiente (2 otra vez = todo)',
  [Filtro.SIN_TRAMITES]: 'filtro 3 · pendiente sin trámites (3 otra vez = todo)',
}

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
