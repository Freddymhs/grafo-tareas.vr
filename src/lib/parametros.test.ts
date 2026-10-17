import { describe, expect, it } from 'vitest'
import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'
import { RADIO_PANORAMA } from './layout'
import { FuenteGrafo, ModoEtiquetas, leerParametros } from './parametros'

describe('leerParametros', () => {
  it('sin query, el grafo real de la API', () => {
    expect(leerParametros('')).toEqual({
      fuente: FuenteGrafo.API,
      nodos: NODOS_PRUEBA,
      semilla: SEMILLA_PRUEBA,
      reordenar: false,
      radio: RADIO_PANORAMA,
      etiquetas: ModoEtiquetas.TODAS,
      pagina: 0,
    })
  })

  it('con nodos o `sintetico`, la prueba de la FASE 1', () => {
    expect(leerParametros('?nodos=300&semilla=7')).toEqual({
      fuente: FuenteGrafo.SINTETICO,
      nodos: 300,
      semilla: 7,
      reordenar: false,
      radio: RADIO_PANORAMA,
      etiquetas: ModoEtiquetas.CERCANAS,
      pagina: 0,
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

  it('el grafo real muestra todas las etiquetas (para depurar el acomodo, FASE 15); `?etiquetas=` lo cambia', () => {
    expect(leerParametros('?etiquetas=cercanas').etiquetas).toBe(ModoEtiquetas.CERCANAS)
    expect(leerParametros('?nodos=100&etiquetas=todas').etiquetas).toBe(ModoEtiquetas.TODAS)
    expect(leerParametros('?etiquetas=otra').etiquetas).toBe(ModoEtiquetas.TODAS)
  })

  it('`?pagina=` abre directo en esa página (FASE 15); si no es un número válido, la primera', () => {
    expect(leerParametros('?pagina=2').pagina).toBe(2)
    expect(leerParametros('?pagina=-1').pagina).toBe(0)
    expect(leerParametros('?pagina=x').pagina).toBe(0)
  })
})
