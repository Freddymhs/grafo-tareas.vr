import { describe, expect, it } from 'vitest'
import type { ConexionResponseDto, NodoResponseDto } from './api/generado/modelos'
import { aGrafo, posicionesGuardadas } from './desde-api'

const nodo = (id: string, extra: Partial<NodoResponseDto> = {}): NodoResponseDto =>
  ({
    id,
    tipo: 'TAREA',
    titulo: id,
    estado: 'ABIERTO',
    etiquetas: [],
    createdAt: '2026-10-17T00:00:00.000Z',
    updatedAt: '2026-10-17T00:00:00.000Z',
    ...extra,
  }) as NodoResponseDto
const conexion = (id: string, origenId: string, destinoId: string): ConexionResponseDto => ({
  id,
  origenId,
  destinoId,
  tipo: 'DEPENDE_DE',
  createdAt: '2026-10-17T00:00:00.000Z',
})

describe('aGrafo', () => {
  it('lleva nodos y conexiones; el color solo si la rama lo tiene', () => {
    const grafo = aGrafo(
      [nodo('a'), nodo('r', { tipo: 'RAMA', color: '#3b82f6' })],
      [conexion('c', 'a', 'r')],
    )
    expect(grafo.nodos).toEqual([
      { id: 'a', tipo: 'TAREA', titulo: 'a', estado: 'ABIERTO' },
      { id: 'r', tipo: 'RAMA', titulo: 'r', estado: 'ABIERTO', color: '#3b82f6' },
    ])
    expect(grafo.conexiones).toHaveLength(1)
  })

  it('una conexión hacia un nodo que no vino no se dibuja', () => {
    expect(aGrafo([nodo('a')], [conexion('c', 'a', 'fantasma')]).conexiones).toEqual([])
  })
})

describe('posicionesGuardadas', () => {
  it('solo las completas', () => {
    const guardadas = posicionesGuardadas([
      nodo('a', { posX: 1, posY: 2, posZ: 3 }),
      nodo('b', { posX: 1, posY: null, posZ: 3 }),
      nodo('c'),
    ])
    expect([...guardadas]).toEqual([['a', { x: 1, y: 2, z: 3 }]])
  })
})
