import { describe, expect, it } from 'vitest'
import { EstadoNodo, TipoConexion, TipoNodo, type Grafo, type Posicion } from './dominio'
import { ALTURA_OJOS, RADIO_LIBRE, RADIO_MUNDO } from './layout'
import { SEPARACION_VECINO, hashUnitario, ubicarFaltantes } from './ubicar'

const nodo = (id: string) => ({ id, tipo: TipoNodo.TAREA, titulo: id, estado: EstadoNodo.ABIERTO })
const grafo: Grafo = {
  nodos: [nodo('a'), nodo('b'), nodo('nuevo-con-vecino'), nodo('nuevo-solo')],
  conexiones: [
    { id: 'c1', origenId: 'nuevo-con-vecino', destinoId: 'a', tipo: TipoConexion.DEPENDE_DE },
    { id: 'c2', origenId: 'nuevo-con-vecino', destinoId: 'b', tipo: TipoConexion.DEPENDE_DE },
  ],
}
const guardadas: ReadonlyMap<string, Posicion> = new Map([
  ['a', { x: 2, y: ALTURA_OJOS, z: 0 }],
  ['b', { x: 0, y: ALTURA_OJOS, z: 2 }],
])
const radio = ({ x, y, z }: Posicion) => Math.hypot(x, y - ALTURA_OJOS, z)

describe('ubicarFaltantes', () => {
  const { posiciones, nuevas } = ubicarFaltantes(grafo, guardadas)

  it('no mueve lo guardado y solo devuelve como nuevas las que faltaban', () => {
    expect(posiciones.get('a')).toEqual(guardadas.get('a'))
    expect(posiciones.get('b')).toEqual(guardadas.get('b'))
    expect([...nuevas.keys()].sort()).toEqual(['nuevo-con-vecino', 'nuevo-solo'])
    expect(posiciones.size).toBe(grafo.nodos.length)
  })

  it('un nodo con vecinos ubicados cae junto al centro de ellos', () => {
    const p = nuevas.get('nuevo-con-vecino')
    const centro = { x: 1, y: ALTURA_OJOS, z: 1 }
    expect(p).toBeDefined()
    const distancia = Math.hypot(
      (p?.x ?? 0) - centro.x,
      (p?.y ?? 0) - centro.y,
      (p?.z ?? 0) - centro.z,
    )
    expect(distancia).toBeLessThanOrEqual(SEPARACION_VECINO + 1e-9)
  })

  it('todo queda en la cáscara del mundo alrededor de los ojos', () => {
    nuevas.forEach((p) => {
      expect(radio(p)).toBeGreaterThanOrEqual(RADIO_LIBRE - 1e-9)
      expect(radio(p)).toBeLessThanOrEqual(RADIO_MUNDO + 1e-9)
    })
  })

  it('es determinista: dos cargas, el mismo mapa (FASE 6, criterio 2)', () => {
    expect(ubicarFaltantes(grafo, guardadas).nuevas).toEqual(nuevas)
  })

  it('con todo guardado no hay nada que guardar', () => {
    expect(ubicarFaltantes(grafo, posiciones).nuevas.size).toBe(0)
  })
})

describe('hashUnitario', () => {
  it('está en [0, 1) y cambia con la sal', () => {
    const h = hashUnitario('x', 'theta')
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(1)
    expect(hashUnitario('x', 'phi')).not.toBe(h)
    expect(hashUnitario('x', 'theta')).toBe(h)
  })
})
