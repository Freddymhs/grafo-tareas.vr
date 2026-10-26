import { describe, expect, it } from 'vitest'
import type { CarrilDto, PiezaDelPlanDto } from './api/generado/modelos'
import { marcasDelPlan } from './plan'

const AZUL = '#0ea5e9'
const VERDE = '#14b8a6'
const AMARILLO = '#eab308'

const pieza = (
  id: string,
  orden: number,
  pelotitas: PiezaDelPlanDto['pelotitas'],
): PiezaDelPlanDto => ({
  id,
  tipo: 'TAREA',
  titulo: id,
  estado: 'ABIERTO',
  cara: 'PLAN',
  etiquetas: [],
  orden,
  pelotitas,
})
const carril = (titulo: string, color: string | null, nodos: PiezaDelPlanDto[]): CarrilDto => ({
  id: titulo,
  titulo,
  color,
  nodos,
})

describe('marcasDelPlan — el número y las líneas que espera, tal como los manda la API', () => {
  // La HU 24576 del 26-10 (`GET /derivado/plan`).
  const plan = [
    carril('A · Detalle', AZUL, [pieza('26957', 1, [{ carril: 'A · Detalle', color: AZUL }])]),
    carril('B · Revisión', VERDE, [
      pieza('26958', 1, [{ carril: 'B · Revisión', color: VERDE }]),
      pieza('26960', 2, [{ carril: 'B · Revisión', color: VERDE }]),
    ]),
    carril('C · Áreas', AMARILLO, [
      pieza('26963', 1, [
        { carril: 'C · Áreas', color: AMARILLO },
        { carril: 'A · Detalle', color: AZUL },
      ]),
    ]),
  ]

  it('cada pieza lleva su orden; la que espera a otro carril, el color de esa línea', () => {
    const marcas = marcasDelPlan(plan)
    expect(marcas.get('26960')).toEqual({ orden: 2, esperas: [] })
    expect(marcas.get('26963')).toEqual({ orden: 1, esperas: [AZUL] })
  })

  it('«Sin carril» no tiene pelotita propia: todo lo que trae son esperas', () => {
    const sinCarril = carril('Sin carril', null, [
      pieza('x', 1, [{ carril: 'A · Detalle', color: AZUL }]),
    ])
    expect(marcasDelPlan([sinCarril]).get('x')).toEqual({ orden: 1, esperas: [AZUL] })
  })
})
