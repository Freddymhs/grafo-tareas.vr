// Lo resuelto no se borra: se cierra y queda en el histórico (Freddy, 2026-10-19: «si no, voy a olvidar que tenía estas
// preguntas… y que las logré solucionar»). Los filtros 2-4 lo apagan como a lo mergeado; una duda contestada además
// lleva ✓ en su texto —no una marca sobre el nodo, que ya se descartó el 18-10— y al seleccionarla dice la respuesta,
// que es el motivo con que se cerró (`GET /nodos/:id/cambios`). Puro.

import type { CambioResponseDto } from './api/generado/modelos'
import { EstadoNodo, TipoNodo, type Nodo } from './dominio'
import { fechaCorta } from './paginas'

export const MARCA_CONTESTADA = '✓'

const CAMPO_ESTADO = 'estado'

type ConEstado = Pick<Nodo, 'tipo' | 'estado'>

export const esDudaContestada = ({ tipo, estado }: ConEstado) =>
  tipo === TipoNodo.DUDA && estado === EstadoNodo.CERRADO

/** El ✓ va delante del texto ya armado (con su fecha si la lleva), para no tapar el «19-oct ·» que lo ubica. */
export function conMarca(nodo: ConEstado, texto: string): string {
  return esDudaContestada(nodo) ? `${MARCA_CONTESTADA} ${texto}` : texto
}

export interface ConteoDeDudas {
  readonly abiertas: number
  readonly contestadas: number
}

/** El avance de una página en dudas: cuántas quedan y cuántas se mataron (Freddy: «que estoy matando dudas»). */
export function conteoDeDudas(nodos: readonly ConEstado[]): ConteoDeDudas {
  const dudas = nodos.filter(({ tipo }) => tipo === TipoNodo.DUDA)
  const contestadas = dudas.filter(esDudaContestada).length
  return { abiertas: dudas.length - contestadas, contestadas }
}

/** La línea de la leyenda; una página sin dudas no la lleva. */
export function textoDeDudas({ abiertas, contestadas }: ConteoDeDudas): string | null {
  const sinDudas = abiertas + contestadas === 0
  if (sinDudas) return null
  return `dudas: ${abiertas} abiertas · ${MARCA_CONTESTADA} ${contestadas} contestadas`
}

/** «Contestada el 19-oct: <motivo>» con el cierre más reciente de la bitácora (lo más reciente primero). */
export function resumenDeCierre(nodo: ConEstado, bitacora: readonly CambioResponseDto[]): string {
  const como = esDudaContestada(nodo) ? 'Contestada' : 'Cerrada'
  const cierre = bitacora.find(
    ({ campo, despues }) => campo === CAMPO_ESTADO && despues === EstadoNodo.CERRADO,
  )
  if (!cierre) return como
  const cuando = `${como} el ${fechaCorta(cierre.createdAt)}`
  return cierre.motivo ? `${cuando}: ${cierre.motivo}` : cuando
}
