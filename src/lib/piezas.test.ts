import { describe, expect, it } from 'vitest'
import { EstadoNodo, TipoNodo } from './dominio'
import { contarPiezasSinTask, textoDePiezas } from './piezas'

const pieza = (estado: EstadoNodo, porCrear: boolean) => ({
  tipo: TipoNodo.TAREA,
  estado,
  porCrear,
})

describe('contarPiezasSinTask — lo que el plan todavía no tiene en el tracker (Freddy, 2026-10-19)', () => {
  it('cuenta las tareas abiertas por crear; una cerrada o con task no cuenta', () => {
    const nodos = [
      pieza(EstadoNodo.ABIERTO, true),
      pieza(EstadoNodo.ABIERTO, true),
      pieza(EstadoNodo.CERRADO, true),
      pieza(EstadoNodo.ABIERTO, false),
      { tipo: TipoNodo.DUDA, estado: EstadoNodo.ABIERTO, porCrear: true },
    ]
    expect(contarPiezasSinTask(nodos)).toBe(2)
  })

  it('el texto de la leyenda dice qué son: candidatas a PBI; sin piezas, nada', () => {
    expect(textoDePiezas(8)).toBe('piezas sin task (candidatas a PBI): 8')
    expect(textoDePiezas(0)).toBeNull()
  })
})
