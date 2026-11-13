import { describe, expect, it } from 'vitest'
import type { ConexionResponseDto, NodoResponseDto } from './api/generado/modelos'
import {
  ETIQUETA_ESPERA,
  ETIQUETA_MERGEADA,
  ETIQUETA_POR_CREAR,
  ETIQUETA_TRAMITE,
} from './constants/grafo'
import { aGrafo, posicionesGuardadas } from './desde-api'

const nodo = (id: string, extra: Partial<NodoResponseDto> = {}): NodoResponseDto =>
  ({
    id,
    tipo: 'TAREA',
    titulo: id,
    estado: 'ABIERTO',
    etiquetas: [],
    fechaOrigen: '2026-10-14T19:50:39.673Z',
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

describe('aGrafo con vecinos de otros proyectos (FASE 24, D8)', () => {
  const rotulo = (proyectoId: string) =>
    proyectoId === 'p-tp' ? 'ThinkPad · Mis máquinas' : 'otro proyecto'

  it('un vecino de otro proyecto entra como nodo fantasma y su conexión se conserva', () => {
    const grafo = aGrafo(
      [nodo('tarea', { proyectoId: 'p-sag' })],
      [conexion('c', 'herramienta', 'tarea')],
      [nodo('herramienta', { tipo: 'HERRAMIENTA', proyectoId: 'p-tp' })],
      rotulo,
    )
    expect(grafo.nodos.map(({ id }) => id)).toEqual(['tarea', 'herramienta'])
    expect(grafo.nodos.find(({ id }) => id === 'herramienta')).toMatchObject({
      tipo: 'HERRAMIENTA',
      proyectoId: 'p-tp',
      fantasma: 'ThinkPad · Mis máquinas',
    })
    expect(grafo.nodos.find(({ id }) => id === 'tarea')?.fantasma).toBeUndefined()
    expect(grafo.conexiones).toHaveLength(1)
  })

  it('un vecino que ya vino entre los nodos no se duplica ni se vuelve fantasma', () => {
    const grafo = aGrafo([nodo('a'), nodo('b')], [], [nodo('b')], rotulo)
    expect(grafo.nodos.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(grafo.nodos.find(({ id }) => id === 'b')?.fantasma).toBeUndefined()
  })

  it('sin vecinos es lo de siempre', () => {
    expect(aGrafo([nodo('a')], [])).toEqual(aGrafo([nodo('a')], [], [], rotulo))
  })
})

describe('aGrafo', () => {
  it('lleva nodos y conexiones; el color solo si la rama lo tiene', () => {
    const grafo = aGrafo(
      [nodo('a'), nodo('r', { tipo: 'RAMA', color: '#3b82f6' })],
      [conexion('c', 'a', 'r')],
    )
    expect(grafo.nodos).toEqual([
      { id: 'a', tipo: 'TAREA', titulo: 'a', estado: 'ABIERTO', fecha: '2026-10-14T19:50:39.673Z' },
      {
        id: 'r',
        tipo: 'RAMA',
        titulo: 'r',
        estado: 'ABIERTO',
        color: '#3b82f6',
        fecha: '2026-10-14T19:50:39.673Z',
      },
    ])
    expect(grafo.conexiones).toHaveLength(1)
  })

  it('una conexión hacia un nodo que no vino no se dibuja', () => {
    expect(aGrafo([nodo('a')], [conexion('c', 'a', 'fantasma')]).conexiones).toEqual([])
  })

  it('mergeada solo con la etiqueta de la API (FASE 17)', () => {
    const [conEtiqueta, sinEtiqueta, otraEtiqueta] = aGrafo(
      [
        nodo('f', { tipo: 'FASE', etiquetas: [ETIQUETA_MERGEADA] }),
        nodo('g', { tipo: 'FASE' }),
        nodo('h', { tipo: 'FASE', etiquetas: ['otra'] }),
      ],
      [],
    ).nodos
    expect(conEtiqueta?.mergeada).toBe(true)
    expect(sinEtiqueta?.mergeada).toBeUndefined()
    expect(otraEtiqueta?.mergeada).toBeUndefined()
  })

  it('trámite solo con la etiqueta de la API (FASE 15 t3)', () => {
    const [conEtiqueta, sinEtiqueta] = aGrafo(
      [nodo('t', { etiquetas: [ETIQUETA_TRAMITE] }), nodo('u', { etiquetas: ['board'] })],
      [],
    ).nodos
    expect(conEtiqueta?.tramite).toBe(true)
    expect(sinEtiqueta?.tramite).toBeUndefined()
  })

  it('pieza por crear solo con la etiqueta del reparto (Freddy, 2026-10-19)', () => {
    const [porCrear, conTask] = aGrafo(
      [
        nodo('p', { etiquetas: ['pieza', ETIQUETA_POR_CREAR] }),
        nodo('q', { etiquetas: ['pieza'] }),
      ],
      [],
    ).nodos
    expect(porCrear?.porCrear).toBe(true)
    expect(conTask?.porCrear).toBeUndefined()
  })

  it('lo que espera a otro, solo con la etiqueta del complemento espera (Freddy, 2026-10-19)', () => {
    const [espera, duda] = aGrafo(
      [
        nodo('e', { tipo: 'DUDA', etiquetas: [ETIQUETA_ESPERA] }),
        nodo('d', { tipo: 'DUDA', etiquetas: ['complemento:duda-negocio'] }),
      ],
      [],
    ).nodos
    expect(espera?.espera).toBe(true)
    expect(duda?.espera).toBeUndefined()
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
