import { describe, expect, it } from 'vitest'
import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'
import { EstadoNodo, TipoConexion, TipoNodo, type Grafo, type Posicion } from './dominio'
import { ALTO_MEDIO, ALTURA_OJOS, RADIO_PANORAMA, anguloDe, calcularLayout } from './layout'
import { generarGrafo } from './sintetico'

const grafo = generarGrafo({ nodos: NODOS_PRUEBA, semilla: SEMILLA_PRUEBA })
const TOLERANCIA = 1e-9

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

describe('calcularLayout — la pantalla curva (FASE 15)', () => {
  const SUELTAS = ['suelta-c', 'suelta-a', 'suelta-b']
  const conSueltas: Grafo = {
    nodos: [
      ...grafo.nodos,
      ...SUELTAS.map((id) => ({
        id,
        tipo: TipoNodo.TAREA,
        titulo: id,
        estado: EstadoNodo.ABIERTO,
      })),
    ],
    conexiones: grafo.conexiones,
  }
  const posiciones = calcularLayout(conSueltas)
  const todas = [...posiciones.values()]
  const horizontal = ({ x, z }: Posicion) => Math.hypot(x, z)
  const detras = (p: Posicion) => Math.abs(Math.abs(anguloDe(p)) - Math.PI) < Math.PI / 2

  it('da una posición finita a cada nodo, todas a la misma distancia del usuario', () => {
    expect(posiciones.size).toBe(conSueltas.nodos.length)
    expect(todas.every(({ x, y, z }) => [x, y, z].every(Number.isFinite))).toBe(true)
    todas.forEach((p) => expect(horizontal(p)).toBeCloseTo(RADIO_PANORAMA, 9))
  })

  it('a la altura de los ojos: ni muy arriba ni muy abajo (sin subir ni bajar)', () => {
    todas.forEach(({ y }) => {
      expect(y).toBeGreaterThanOrEqual(ALTURA_OJOS - ALTO_MEDIO - TOLERANCIA)
      expect(y).toBeLessThanOrEqual(ALTURA_OJOS + ALTO_MEDIO + TOLERANCIA)
    })
  })

  it('lo conectado rodea al usuario; las sueltas van juntas detrás, no lanzadas al borde', () => {
    SUELTAS.forEach((id) => expect(detras(posiciones.get(id) ?? { x: 0, y: 0, z: -1 })).toBe(true))
    const conectadas = grafo.nodos.map(({ id }) => posiciones.get(id) ?? { x: 0, y: 0, z: 0 })
    expect(conectadas.some((p) => p.z < 0)).toBe(true)
    const derecha = conectadas.filter(({ x }) => x > RADIO_PANORAMA / 2).length
    const izquierda = conectadas.filter(({ x }) => x < -RADIO_PANORAMA / 2).length
    expect(derecha).toBeGreaterThan(0)
    expect(izquierda).toBeGreaterThan(0)
  })

  it('el radio se puede calibrar', () => {
    calcularLayout(conSueltas, 5).forEach((p) => expect(horizontal(p)).toBeCloseTo(5, 9))
  })

  it('es determinista: el mapa es el mismo cada vez', () => {
    expect(calcularLayout(conSueltas)).toEqual(posiciones)
  })
})
