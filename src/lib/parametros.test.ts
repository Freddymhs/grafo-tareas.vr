import { describe, expect, it } from 'vitest'
import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'
import { FuenteGrafo, leerParametros } from './parametros'

describe('leerParametros', () => {
  it('sin query, el grafo real de la API', () => {
    expect(leerParametros('')).toEqual({
      fuente: FuenteGrafo.API,
      nodos: NODOS_PRUEBA,
      semilla: SEMILLA_PRUEBA,
    })
  })

  it('con nodos o `sintetico`, la prueba de la FASE 1', () => {
    expect(leerParametros('?nodos=300&semilla=7')).toEqual({
      fuente: FuenteGrafo.SINTETICO,
      nodos: 300,
      semilla: 7,
    })
    expect(leerParametros('?sintetico').fuente).toBe(FuenteGrafo.SINTETICO)
  })

  it('basura o fuera de rango vuelve al default', () => {
    expect(leerParametros('?nodos=abc').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=5').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=99999').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=12.5').nodos).toBe(NODOS_PRUEBA)
  })
})
