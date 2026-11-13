import { describe, expect, it } from 'vitest'
import { colorApagado, colorDeTextoSobre, colorDeTipo, coloresPorNodo } from './colores'
import {
  COLOR_DUDA,
  COLOR_FASE,
  COLOR_HISTORIA,
  COLOR_PARA_DECIR,
  COLOR_PBI_A_MEDIAS,
  COLOR_SIN_RAMA,
} from './constants/grafo'
import { EstadoNodo, Pbi, TipoConexion, TipoNodo, type Grafo, type Nodo } from './dominio'

const nodo = (id: string, tipo: string, color?: string): Nodo => ({
  id,
  tipo,
  titulo: id,
  estado: EstadoNodo.ABIERTO,
  ...(color ? { color } : {}),
})
const pertenece = (origenId: string, destinoId: string) => ({
  id: `${origenId}->${destinoId}`,
  origenId,
  destinoId,
  tipo: TipoConexion.PERTENECE_A,
})

describe('coloresPorNodo', () => {
  const grafo: Grafo = {
    nodos: [
      nodo('hu', TipoNodo.HISTORIA),
      nodo('fase', TipoNodo.FASE),
      nodo('verde', TipoNodo.RAMA, '#22c55e'),
      nodo('tarjeta', TipoNodo.TAREA),
      nodo('suelta', TipoNodo.TAREA),
    ],
    // La tarjeta pertenece PRIMERO a su FASE (R3) y después a su rama: igual tiene que verse del color de la rama.
    conexiones: [
      pertenece('fase', 'hu'),
      pertenece('tarjeta', 'fase'),
      pertenece('tarjeta', 'verde'),
    ],
  }
  const colores = coloresPorNodo(grafo)

  it('la HU y la FASE tienen su color propio: son el esqueleto del árbol (FASE 13)', () => {
    expect(colores.get('hu')).toBe(COLOR_HISTORIA)
    expect(colores.get('fase')).toBe(COLOR_FASE)
  })

  it('una tarea toma el color de su RAMA aunque antes pertenezca a una FASE o a una HU', () => {
    expect(colores.get('tarjeta')).toBe('#22c55e')
    expect(colores.get('suelta')).toBe(COLOR_SIN_RAMA)
  })

  it('morado = PBI aunque esté en un carril; el PBI a medias y lo «para decir» tienen color propio (Freddy, 2026-10-18)', () => {
    const otros = coloresPorNodo({
      nodos: [
        { ...nodo('entero', TipoNodo.TAREA), pbi: Pbi.ENTERO },
        { ...nodo('a-medias', TipoNodo.TAREA), pbi: Pbi.A_MEDIAS },
        { ...nodo('fase-sin-task', TipoNodo.FASE), pbi: Pbi.SIN_TASK },
        nodo('para-decir', TipoNodo.DAILY_ITEM),
        nodo('verde', TipoNodo.RAMA, '#22c55e'),
      ],
      conexiones: [pertenece('entero', 'verde')],
    })
    expect(otros.get('entero')).toBe(COLOR_FASE)
    expect(otros.get('a-medias')).toBe(COLOR_PBI_A_MEDIAS)
    expect(otros.get('fase-sin-task')).toBe(COLOR_PBI_A_MEDIAS)
    expect(otros.get('para-decir')).toBe(COLOR_PARA_DECIR)
  })
})

describe('colorApagado — lo que queda fuera de la familia seleccionada (FASE 15)', () => {
  it('se acerca al fondo: más oscuro, pero todavía se distingue', () => {
    const brillo = (hex: string) =>
      [1, 3, 5].reduce((suma, i) => suma + Number.parseInt(hex.slice(i, i + 2), 16), 0)
    const original = '#22c55e'
    const apagado = colorApagado(original)
    expect(apagado).toMatch(/^#[0-9a-f]{6}$/)
    expect(brillo(apagado)).toBeLessThan(brillo(original) / 2)
    expect(apagado).not.toBe('#020617')
  })
})

describe('colorDeTextoSobre — el número del plan se lee en el color de cualquier carril', () => {
  it('sobre los tres carriles de la 24576 (azul, verde, amarillo) va oscuro', () => {
    expect(['#0ea5e9', '#14b8a6', '#eab308'].map(colorDeTextoSobre)).toEqual([
      '#020617',
      '#020617',
      '#020617',
    ])
  })

  it('sobre un color oscuro va blanco', () => {
    expect(colorDeTextoSobre('#1e3a8a')).toBe('#ffffff')
    expect(colorDeTextoSobre('#020617')).toBe('#ffffff')
  })
})

describe('coloresPorNodo con el color de cada tipo (FASE 24, D11)', () => {
  const grafo: Grafo = {
    nodos: [nodo('h', 'HERRAMIENTA'), nodo('t', TipoNodo.TAREA), nodo('p', TipoNodo.PERSONA)],
    conexiones: [],
  }
  const colorPorTipo = new Map([
    ['HERRAMIENTA', '#22c55e'],
    ['TAREA', '#ff0000'],
    ['PERSONA', '#0000ff'],
  ])

  it('un tipo que el método no conoce toma el color de su tipo', () => {
    expect(coloresPorNodo(grafo, colorPorTipo).get('h')).toBe('#22c55e')
  })

  it('sin mapa, o sin color para ese tipo, es el de hoy', () => {
    expect(coloresPorNodo(grafo).get('h')).toBe(COLOR_SIN_RAMA)
    expect(coloresPorNodo(grafo, new Map()).get('h')).toBe(COLOR_SIN_RAMA)
  })

  it('los tipos del método conservan su color de siempre', () => {
    const colores = coloresPorNodo(grafo, colorPorTipo)
    expect(colores.get('t')).toBe(COLOR_SIN_RAMA)
    expect(colores.get('p')).toBe(coloresPorNodo(grafo).get('p'))
  })
})

describe('colorDeTipo — el punto de cada tipo en la leyenda, del mismo color que sus nodos (FASE 26, D3)', () => {
  it('un tipo que el método no conoce, con el color de su tipo; sin color, el de hoy', () => {
    expect(colorDeTipo({ nombre: 'MAQUINA', color: '#22c55e' })).toBe('#22c55e')
    expect(colorDeTipo({ nombre: 'FAMILIA', color: null })).toBe(COLOR_SIN_RAMA)
  })

  it('un tipo del método conserva su color de siempre aunque el espacio le dé otro', () => {
    expect(colorDeTipo({ nombre: TipoNodo.DUDA, color: '#000000' })).toBe(COLOR_DUDA)
    expect(colorDeTipo({ nombre: TipoNodo.TAREA, color: '#000000' })).toBe(COLOR_SIN_RAMA)
  })

  it('coincide con el color de un nodo de ese tipo sin rama', () => {
    const colorPorTipo = new Map([['MAQUINA', '#22c55e']])
    const grafo: Grafo = {
      nodos: [nodo('m', 'MAQUINA'), nodo('p', TipoNodo.PERSONA)],
      conexiones: [],
    }
    const colores = coloresPorNodo(grafo, colorPorTipo)
    expect(colorDeTipo({ nombre: 'MAQUINA', color: '#22c55e' })).toBe(colores.get('m'))
    expect(colorDeTipo({ nombre: TipoNodo.PERSONA })).toBe(colores.get('p'))
  })
})
