import { describe, expect, it } from 'vitest'
import { CambioResponseDtoTipo, type CambioResponseDto } from './api/generado/modelos'
import { EstadoNodo, TipoNodo } from './dominio'
import { conMarca, conteoDeDudas, resumenDeCierre, textoDeDudas } from './cierre'

const dudaCerrada = { tipo: TipoNodo.DUDA, estado: EstadoNodo.CERRADO }
const tareaCerrada = { tipo: TipoNodo.TAREA, estado: EstadoNodo.CERRADO }

const cierre = (motivo: string | null, createdAt: string): CambioResponseDto => ({
  id: createdAt,
  nodoId: 'duda',
  titulo: '¿quién asigna las Unidades en QA?',
  tipo: CambioResponseDtoTipo.EDICION,
  campo: 'estado',
  despues: EstadoNodo.CERRADO,
  motivo,
  createdAt,
})

describe('conMarca — la duda contestada se lee de un vistazo por su ✓ (Freddy, 2026-10-19)', () => {
  it('la DUDA cerrada lleva ✓ delante del texto que ya se arma (con fecha y todo)', () => {
    expect(conMarca(dudaCerrada, '19-oct · ¿quién?')).toBe('✓ 19-oct · ¿quién?')
  })

  it('abierta, o de otro tipo, va tal cual: lo demás cerrado ya lo apagan los filtros', () => {
    expect(conMarca({ ...dudaCerrada, estado: EstadoNodo.ABIERTO }, '¿quién?')).toBe('¿quién?')
    expect(conMarca(tareaCerrada, 'hecha')).toBe('hecha')
  })
})

describe('conMarca — lo ya pedido que espera a otro (Freddy, 2026-10-19: «ahora me falta que él me lo destrabe»)', () => {
  const espera = { tipo: TipoNodo.DUDA, estado: EstadoNodo.ABIERTO, espera: true }

  it('abierta lleva «espera ·» delante, en palabras: la fuente 3D no tiene el reloj de arena', () => {
    expect(conMarca(espera, '16-oct · la planilla')).toBe('espera · 16-oct · la planilla')
  })

  it('cuando llega se cierra, y es una duda contestada más: ✓', () => {
    expect(conMarca({ ...espera, estado: EstadoNodo.CERRADO }, 'la planilla')).toBe('✓ la planilla')
  })
})

describe('resumenDeCierre — lo que dice la selección de algo cerrado: cuándo y la respuesta', () => {
  it('una duda: «Contestada el <fecha>» y el motivo del cierre más reciente', () => {
    const bitacora = [
      cierre('Thomas: «el 1 y el 2 todavía no»', '2026-10-19T15:43:00.000Z'),
      cierre('uno anterior', '2026-10-10T09:00:00.000Z'),
    ]
    expect(resumenDeCierre(dudaCerrada, bitacora)).toBe(
      'Contestada el 19-oct: Thomas: «el 1 y el 2 todavía no»',
    )
  })

  it('otra cosa cerrada sin motivo dice «Cerrada el <fecha>»; sin bitácora (la cerró un importador), solo «Cerrada»', () => {
    expect(resumenDeCierre(tareaCerrada, [cierre(null, '2026-10-19T15:43:00.000Z')])).toBe(
      'Cerrada el 19-oct',
    )
    expect(resumenDeCierre(tareaCerrada, [])).toBe('Cerrada')
  })
})

describe('conteoDeDudas / textoDeDudas — el avance de la página: cuántas dudas quedan y cuántas se mataron', () => {
  it('cuenta solo las DUDA: abiertas y contestadas (cerradas)', () => {
    const nodos = [
      dudaCerrada,
      dudaCerrada,
      { tipo: TipoNodo.DUDA, estado: EstadoNodo.ABIERTO },
      tareaCerrada,
    ]
    expect(conteoDeDudas(nodos)).toEqual({ abiertas: 1, esperando: 0, contestadas: 2 })
  })

  it('lo que espera a otro se cuenta aparte de las abiertas: ya está en la cancha del otro', () => {
    const nodos = [
      { tipo: TipoNodo.DUDA, estado: EstadoNodo.ABIERTO, espera: true },
      { tipo: TipoNodo.DUDA, estado: EstadoNodo.CERRADO, espera: true },
      { tipo: TipoNodo.DUDA, estado: EstadoNodo.ABIERTO },
    ]
    expect(conteoDeDudas(nodos)).toEqual({ abiertas: 1, esperando: 1, contestadas: 1 })
  })

  it('el texto de la leyenda; «esperando» solo si hay; una página sin dudas no lo lleva', () => {
    expect(textoDeDudas({ abiertas: 7, esperando: 0, contestadas: 4 })).toBe(
      'dudas: 7 abiertas · ✓ 4 contestadas',
    )
    expect(textoDeDudas({ abiertas: 4, esperando: 2, contestadas: 13 })).toBe(
      'dudas: 4 abiertas · 2 esperando a otros · ✓ 13 contestadas',
    )
    expect(textoDeDudas({ abiertas: 0, esperando: 0, contestadas: 0 })).toBeNull()
  })
})
