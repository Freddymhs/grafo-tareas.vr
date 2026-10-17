import { describe, expect, it } from 'vitest'
import { EstadoNodo, TipoConexion, TipoNodo, type Grafo, type Posicion } from './dominio'
import { ALTO_MEDIO, ALTURA_OJOS, anguloDe, enCilindro } from './layout'
import { hashUnitario } from './hash'
import { SEPARACION_VECINO, ubicarFaltantes } from './ubicar'

const nodo = (id: string) => ({ id, tipo: TipoNodo.TAREA, titulo: id, estado: EstadoNodo.ABIERTO })
const grafo: Grafo = {
  nodos: [nodo('a'), nodo('b'), nodo('nuevo-con-vecino'), nodo('nuevo-solo')],
  conexiones: [
    { id: 'c1', origenId: 'nuevo-con-vecino', destinoId: 'a', tipo: TipoConexion.DEPENDE_DE },
    { id: 'c2', origenId: 'nuevo-con-vecino', destinoId: 'b', tipo: TipoConexion.DEPENDE_DE },
  ],
}
/** Un mapa guardado de radio 2: a 30° a la izquierda y a la derecha del frente. */
const RADIO_GUARDADO = 2
const guardadas: ReadonlyMap<string, Posicion> = new Map([
  ['a', enCilindro(-Math.PI / 6, ALTURA_OJOS, RADIO_GUARDADO)],
  ['b', enCilindro(Math.PI / 6, ALTURA_OJOS, RADIO_GUARDADO)],
])
const horizontal = ({ x, z }: Posicion) => Math.hypot(x, z)

describe('ubicarFaltantes — sobre la pantalla curva (FASE 15)', () => {
  const { posiciones, nuevas } = ubicarFaltantes(grafo, guardadas)

  it('no mueve lo guardado y solo devuelve como nuevas las que faltaban', () => {
    expect(posiciones.get('a')).toEqual(guardadas.get('a'))
    expect(posiciones.get('b')).toEqual(guardadas.get('b'))
    expect([...nuevas.keys()].sort()).toEqual(['nuevo-con-vecino', 'nuevo-solo'])
    expect(posiciones.size).toBe(grafo.nodos.length)
  })

  it('un nodo con vecinos ubicados cae entre ellos, en la misma pantalla', () => {
    const p = nuevas.get('nuevo-con-vecino') ?? { x: 0, y: 0, z: 0 }
    expect(Math.abs(anguloDe(p))).toBeLessThanOrEqual(SEPARACION_VECINO / RADIO_GUARDADO + 1e-9)
    expect(Math.abs(p.y - ALTURA_OJOS)).toBeLessThanOrEqual(SEPARACION_VECINO + 1e-9)
  })

  it('uno sin vecinos va detrás, con las sueltas', () => {
    const p = nuevas.get('nuevo-solo') ?? { x: 0, y: 0, z: -1 }
    expect(p.z).toBeGreaterThan(0)
  })

  it('en una página, uno sin vecinos va a donde la página pone sus sueltas (FASE 15)', () => {
    const enPagina = ubicarFaltantes(grafo, guardadas, Math.PI / 2).nuevas.get('nuevo-solo')
    expect(Math.abs(anguloDe(enPagina ?? { x: 0, y: 0, z: -1 }) - Math.PI / 2)).toBeLessThan(
      Math.PI / 6,
    )
  })

  it('todo queda en la pantalla del mapa guardado: su radio y la banda de los ojos', () => {
    nuevas.forEach((p) => {
      expect(horizontal(p)).toBeCloseTo(RADIO_GUARDADO, 9)
      expect(Math.abs(p.y - ALTURA_OJOS)).toBeLessThanOrEqual(ALTO_MEDIO + 1e-9)
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
