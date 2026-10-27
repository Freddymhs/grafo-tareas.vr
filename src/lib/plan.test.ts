import { describe, expect, it } from 'vitest'
import type { CarrilDto, PiezaDelPlanDto } from './api/generado/modelos'
import { Pbi, TipoNodo, EstadoNodo, type Grafo } from './dominio'
import { marcasDelPlan, vistaDelPlan } from './plan'

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
    carril('A · Detalle', AZUL, [
      pieza('26957', 1, [{ carril: 'A · Detalle', color: AZUL, espera: null }]),
    ]),
    carril('B · Revisión', VERDE, [
      pieza('26958', 1, [{ carril: 'B · Revisión', color: VERDE, espera: null }]),
      pieza('26960', 2, [{ carril: 'B · Revisión', color: VERDE, espera: null }]),
    ]),
    carril('C · Áreas', AMARILLO, [
      pieza('26963', 1, [
        { carril: 'C · Áreas', color: AMARILLO, espera: null },
        { carril: 'A · Detalle', color: AZUL, espera: 1 },
      ]),
    ]),
  ]

  it('cada pieza lleva su orden; la que espera a otro carril, el color de esa línea y el número que espera', () => {
    const marcas = marcasDelPlan(plan)
    expect(marcas.get('26960')).toEqual({ orden: 2, esperas: [], tomada: false })
    expect(marcas.get('26963')).toEqual({
      orden: 1,
      esperas: [{ color: AZUL, numero: 1 }],
      tomada: false,
    })
  })

  it('«Sin carril» no tiene pelotita propia: todo lo que trae son esperas', () => {
    const sinCarril = carril('Sin carril', null, [
      pieza('x', 1, [{ carril: 'A · Detalle', color: AZUL, espera: 2 }]),
    ])
    expect(marcasDelPlan([sinCarril]).get('x')).toEqual({
      orden: 1,
      esperas: [{ color: AZUL, numero: 2 }],
      tomada: false,
    })
  })
})

describe('vistaDelPlan — en el plan se lee la línea, no el aviso de PBI a medias', () => {
  const tomada = {
    id: '26958',
    tipo: TipoNodo.TAREA,
    titulo: '[26958]',
    estado: EstadoNodo.ABIERTO,
    pbi: Pbi.A_MEDIAS,
  }
  const otra = {
    id: 'otra',
    tipo: TipoNodo.TAREA,
    titulo: '[1]',
    estado: EstadoNodo.ABIERTO,
    pbi: Pbi.A_MEDIAS,
  }
  const grafo: Grafo = { nodos: [tomada, otra], conexiones: [] }
  const marcas = new Map([['26958', { orden: 1, esperas: [], tomada: true }]])

  it('la pieza con número pierde el aviso; lo que no es pieza del plan lo conserva', () => {
    const vista = vistaDelPlan(grafo, marcas)
    expect(vista.nodos[0].pbi).toBeUndefined()
    expect(vista.nodos[1].pbi).toBe(Pbi.A_MEDIAS)
  })

  it('la tomada queda marcada: apagada y fuera de lo pendiente', () => {
    expect(vistaDelPlan(grafo, marcas).nodos[0].tomada).toBe(true)
  })

  it('fuera del plan (sin marcas) el grafo queda igual', () => {
    expect(vistaDelPlan(grafo, new Map())).toBe(grafo)
  })
})

describe('tomada — una pieza que ya pasó a trabajo sigue en su línea del plan, apagada', () => {
  it('la API la manda en la cara real: se marca tomada', () => {
    const enCurso = {
      ...pieza('26958', 1, [{ carril: 'B · Revisión', color: VERDE, espera: null }]),
      cara: 'REAL' as const,
    }
    expect(marcasDelPlan([carril('B · Revisión', VERDE, [enCurso])]).get('26958')?.tomada).toBe(
      true,
    )
  })
})
