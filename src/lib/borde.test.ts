import { describe, expect, it } from 'vitest'
import { idsConBorde } from './borde'
import { EstadoNodo, Pbi, TipoNodo, type Nodo } from './dominio'

const nodo = (id: string, pbi?: Pbi): Nodo => ({
  id,
  tipo: TipoNodo.FASE,
  titulo: id,
  estado: EstadoNodo.ABIERTO,
  ...(pbi ? { pbi } : {}),
})

describe('idsConBorde — lo que no está en Azure se ve de un vistazo (Freddy, 2026-10-19: «un borde delgado, pero que se nota»)', () => {
  const nodos = [
    nodo('fase36', Pbi.SIN_TASK),
    nodo('fase18', Pbi.ENTERO),
    nodo('t26750', Pbi.A_MEDIAS),
  ]

  it('solo la FASE sin task lleva borde: la tarjeta sin FASE sí está en Azure', () => {
    expect([...idsConBorde(nodos, null)]).toEqual(['fase36'])
  })

  it('un filtro que la apaga también le apaga el borde', () => {
    expect([...idsConBorde(nodos, new Set(['fase18']))]).toEqual([])
    expect([...idsConBorde(nodos, new Set(['fase36']))]).toEqual(['fase36'])
  })
})
