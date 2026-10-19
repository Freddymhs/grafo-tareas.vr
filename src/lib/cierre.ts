// Lo resuelto no se borra: se cierra y queda en el histórico (Freddy, 2026-10-19: «si no, voy a olvidar que tenía estas
// preguntas… y que las logré solucionar»). Los filtros 2-4 lo apagan como a lo mergeado; una duda contestada además
// lleva ✓ en su texto —no una marca sobre el nodo, que ya se descartó el 18-10— y al seleccionarla dice la respuesta,
// que es el motivo con que se cerró (`GET /nodos/:id/cambios`). Lo ya pedido que espera a otro (complemento `espera`)
// se lee «espera ·» hasta que llega: entonces se cierra y es una contestada más. Puro.

import type { CambioResponseDto } from './api/generado/modelos'
import { EstadoNodo, TipoNodo, type Nodo } from './dominio'
import { fechaCorta } from './paginas'

export const MARCA_CONTESTADA = '✓'
/** En palabras y no ⏳: la fuente de `<Text>` no tiene emojis (`lib/texto-visible.ts`). */
export const MARCA_ESPERA = 'espera ·'

const CAMPO_ESTADO = 'estado'

type ConEstado = Pick<Nodo, 'tipo' | 'estado' | 'espera'>

export const esDudaContestada = ({ tipo, estado }: ConEstado) =>
  tipo === TipoNodo.DUDA && estado === EstadoNodo.CERRADO

/** Pedida y sin llegar: la cancha es del otro (Freddy, 2026-10-19: «ahora me falta que él me lo destrabe»). */
export const esEsperaAbierta = ({ espera, estado }: ConEstado) =>
  espera === true && estado === EstadoNodo.ABIERTO

/** La marca va delante del texto ya armado (con su fecha si la lleva), para no tapar el «19-oct ·» que lo ubica. */
export function conMarca(nodo: ConEstado, texto: string): string {
  if (esDudaContestada(nodo)) return `${MARCA_CONTESTADA} ${texto}`
  if (esEsperaAbierta(nodo)) return `${MARCA_ESPERA} ${texto}`
  return texto
}

export interface ConteoDeDudas {
  readonly abiertas: number
  readonly esperando: number
  readonly contestadas: number
}

/** El avance de una página en dudas: cuántas quedan, cuántas esperan a otro y cuántas se mataron («estoy matando dudas»). */
export function conteoDeDudas(nodos: readonly ConEstado[]): ConteoDeDudas {
  const dudas = nodos.filter(({ tipo }) => tipo === TipoNodo.DUDA)
  const contestadas = dudas.filter(esDudaContestada).length
  const esperando = dudas.filter(esEsperaAbierta).length
  const abiertas = dudas.length - contestadas - esperando
  return { abiertas, esperando, contestadas }
}

/** La línea de la leyenda: «esperando» solo si hay; una página sin dudas no la lleva. */
export function textoDeDudas({ abiertas, esperando, contestadas }: ConteoDeDudas): string | null {
  const sinDudas = abiertas + esperando + contestadas === 0
  if (sinDudas) return null
  const partes = [
    `dudas: ${abiertas} abiertas`,
    esperando > 0 ? `${esperando} esperando a otros` : null,
    `${MARCA_CONTESTADA} ${contestadas} contestadas`,
  ]
  return partes.filter((parte) => parte !== null).join(' · ')
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
