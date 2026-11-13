import { describe, expect, it } from 'vitest'
import type { TipoNodoResponseDto } from './api/generado/modelos'
import { colorDeTipo } from './colores'
import { CERRADA, leyendaDeTipos } from './leyenda'

const tipo = (nombre: string, tieneCiclo: boolean, color?: string): TipoNodoResponseDto => ({
  id: nombre,
  espacioId: 'e1',
  nombre,
  color: color ?? null,
  tieneCiclo,
  accionable: false,
})

describe('leyendaDeTipos — fuera del método, la leyenda habla de los tipos del espacio (FASE 26, D3)', () => {
  it('Mis máquinas: un ítem por tipo, en su orden y con su color, sin «chica = cerrada»', () => {
    const tipos = [
      tipo('MAQUINA', false, '#22c55e'),
      tipo('FAMILIA', false),
      tipo('HERRAMIENTA', false),
    ]
    expect(leyendaDeTipos(tipos)).toEqual(
      tipos.map((uno) => ({ color: colorDeTipo(uno), texto: uno.nombre })),
    )
  })

  it('con algún tipo con ciclo se suma «chica = cerrada» al final', () => {
    const items = leyendaDeTipos([tipo('TAREA', true), tipo('IDEA', false)])
    expect(items.map(({ texto }) => texto)).toEqual(['TAREA', 'IDEA', CERRADA.texto])
  })

  it('sin tipos, sin leyenda', () => {
    expect(leyendaDeTipos([])).toEqual([])
  })
})
