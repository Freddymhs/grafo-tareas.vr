import { describe, expect, it } from 'vitest'
import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'
import { leerParametros } from './parametros'

describe('leerParametros', () => {
  it('sin query, los defaults de la prueba', () => {
    expect(leerParametros('')).toEqual({ nodos: NODOS_PRUEBA, semilla: SEMILLA_PRUEBA })
  })

  it('lee nodos y semilla', () => {
    expect(leerParametros('?nodos=300&semilla=7')).toEqual({ nodos: 300, semilla: 7 })
  })

  it('basura o fuera de rango vuelve al default', () => {
    expect(leerParametros('?nodos=abc').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=5').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=99999').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=12.5').nodos).toBe(NODOS_PRUEBA)
  })
})
