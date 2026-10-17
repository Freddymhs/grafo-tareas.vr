import { describe, expect, it } from 'vitest'
import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'
import { RADIO_PANORAMA } from './layout'
import { FuenteGrafo, leerParametros } from './parametros'

describe('leerParametros', () => {
  it('sin query, el grafo real de la API', () => {
    expect(leerParametros('')).toEqual({
      fuente: FuenteGrafo.API,
      nodos: NODOS_PRUEBA,
      semilla: SEMILLA_PRUEBA,
      reordenar: false,
      radio: RADIO_PANORAMA,
    })
  })

  it('con nodos o `sintetico`, la prueba de la FASE 1', () => {
    expect(leerParametros('?nodos=300&semilla=7')).toEqual({
      fuente: FuenteGrafo.SINTETICO,
      nodos: 300,
      semilla: 7,
      reordenar: false,
      radio: RADIO_PANORAMA,
    })
    expect(leerParametros('?sintetico').fuente).toBe(FuenteGrafo.SINTETICO)
  })

  it('basura o fuera de rango vuelve al default', () => {
    expect(leerParametros('?nodos=abc').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=5').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=99999').nodos).toBe(NODOS_PRUEBA)
    expect(leerParametros('?nodos=12.5').nodos).toBe(NODOS_PRUEBA)
  })

  it('`?reordenar` recalcula el mapa entero con las conexiones de hoy (FASE 13); sin él, las posiciones guardadas mandan', () => {
    expect(leerParametros('?reordenar').reordenar).toBe(true)
    expect(leerParametros('').reordenar).toBe(false)
  })

  it('`?radio=` calibra la distancia de la pantalla curva (FASE 15); fuera de rango, la de siempre', () => {
    expect(leerParametros('?reordenar&radio=4.5').radio).toBe(4.5)
    expect(leerParametros('?radio=0.2').radio).toBe(RADIO_PANORAMA)
    expect(leerParametros('?radio=abc').radio).toBe(RADIO_PANORAMA)
  })
})
