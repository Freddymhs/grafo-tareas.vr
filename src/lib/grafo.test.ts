import { describe, expect, it } from 'vitest'
import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'
import { TipoConexion, TipoNodo } from './dominio'
import { ALTURA_OJOS, RADIO_LIBRE, RADIO_MUNDO, calcularLayout } from './layout'
import { generarGrafo } from './sintetico'

const grafo = generarGrafo({ nodos: NODOS_PRUEBA, semilla: SEMILLA_PRUEBA })
const TOLERANCIA_RADIO = 1e-9

describe('generarGrafo', () => {
  it('da exactamente los nodos pedidos', () => {
    expect(grafo.nodos).toHaveLength(NODOS_PRUEBA)
  })

  it('misma semilla, mismo grafo; otra semilla, otro', () => {
    expect(generarGrafo({ nodos: NODOS_PRUEBA, semilla: SEMILLA_PRUEBA })).toEqual(grafo)
    expect(generarGrafo({ nodos: NODOS_PRUEBA, semilla: SEMILLA_PRUEBA + 1 })).not.toEqual(grafo)
  })

  it('toda conexión apunta a nodos que existen, y los ids no se repiten', () => {
    const ids = new Set(grafo.nodos.map(({ id }) => id))
    const huerfanas = grafo.conexiones.filter((c) => !ids.has(c.origenId) || !ids.has(c.destinoId))
    expect(huerfanas).toEqual([])
    expect(ids.size).toBe(grafo.nodos.length)
    expect(new Set(grafo.conexiones.map(({ id }) => id)).size).toBe(grafo.conexiones.length)
  })

  it('tiene la forma medida: cada tarea en una rama, y entre 1 y 3 conexiones por nodo', () => {
    const tareas = grafo.nodos.filter(({ tipo }) => tipo === TipoNodo.TAREA)
    const enRama = new Set(
      grafo.conexiones
        .filter(({ tipo }) => tipo === TipoConexion.PERTENECE_A)
        .map(({ origenId }) => origenId),
    )
    expect(tareas.every(({ id }) => enRama.has(id))).toBe(true)
    const porNodo = grafo.conexiones.length / grafo.nodos.length
    expect(porNodo).toBeGreaterThan(1)
    expect(porNodo).toBeLessThan(3)
  })

  it('DEPENDE_DE solo apunta hacia atrás: no hay ciclos', () => {
    const indice = (id: string) => Number(id.split('-')[1])
    const dependencias = grafo.conexiones.filter(({ tipo }) => tipo === TipoConexion.DEPENDE_DE)
    expect(dependencias.length).toBeGreaterThan(0)
    expect(dependencias.every((c) => indice(c.destinoId) < indice(c.origenId))).toBe(true)
  })
})

describe('calcularLayout', () => {
  const posiciones = calcularLayout(grafo)

  it('da una posición finita a cada nodo, dentro del radio del mundo', () => {
    expect(posiciones.size).toBe(grafo.nodos.length)
    const todas = [...posiciones.values()]
    expect(todas.every(({ x, y, z }) => [x, y, z].every(Number.isFinite))).toBe(true)
    const radios = todas.map(({ x, y, z }) => Math.hypot(x, y - ALTURA_OJOS, z))
    expect(Math.max(...radios)).toBeLessThanOrEqual(RADIO_MUNDO + TOLERANCIA_RADIO)
    expect(Math.min(...radios)).toBeGreaterThanOrEqual(RADIO_LIBRE - TOLERANCIA_RADIO)
  })

  it('es determinista: el mapa es el mismo cada vez', () => {
    expect(calcularLayout(grafo)).toEqual(posiciones)
  })
})
