import { describe, expect, it } from 'vitest'
import { colorApagado, coloresPorNodo } from './colores'
import {
  COLOR_FASE,
  COLOR_HISTORIA,
  COLOR_PARA_DECIR,
  COLOR_PBI_A_MEDIAS,
  COLOR_SIN_RAMA,
} from './constants/grafo'
import { EstadoNodo, Pbi, TipoConexion, TipoNodo, type Grafo, type Nodo } from './dominio'

const nodo = (id: string, tipo: TipoNodo, color?: string): Nodo => ({
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
        { ...nodo('fase-sin-task', TipoNodo.FASE), pbi: Pbi.A_MEDIAS },
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
