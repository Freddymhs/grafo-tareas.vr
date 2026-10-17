import { describe, expect, it } from 'vitest'
import { coloresPorNodo } from './colores'
import { COLOR_FASE, COLOR_HISTORIA, COLOR_SIN_RAMA } from './constants/grafo'
import { EstadoNodo, TipoConexion, TipoNodo, type Grafo, type Nodo } from './dominio'

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
})
