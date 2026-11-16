import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Grafo } from '../lib/dominio'
import { useLayout } from './useLayout'

const GRAFO: Grafo = { nodos: [], conexiones: [] }

/** Un Worker de mentira: el test decide cuándo responde o falla. */
class WorkerFalso {
  static ultimo: WorkerFalso | null = null
  onmessage: ((evento: { data: unknown }) => void) | null = null
  onerror: ((evento: { message: string; error: unknown }) => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  constructor() {
    WorkerFalso.ultimo = this
  }
}

beforeEach(() => {
  vi.stubGlobal('Worker', WorkerFalso)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  WorkerFalso.ultimo = null
})

describe('useLayout', () => {
  it('sin grafo no lanza ningún Worker', () => {
    const { result } = renderHook(() => useLayout(null))
    expect(WorkerFalso.ultimo).toBeNull()
    expect(result.current).toEqual({ posiciones: null, error: null })
  })

  it('devuelve las posiciones que manda el Worker', () => {
    const { result } = renderHook(() => useLayout(GRAFO))
    act(() => WorkerFalso.ultimo?.onmessage?.({ data: [['a', { x: 1, y: 2, z: 3 }]] }))
    expect(result.current.error).toBeNull()
    expect(result.current.posiciones?.get('a')).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('si el Worker falla, deja el error en vez de quedarse esperando', () => {
    const { result } = renderHook(() => useLayout(GRAFO))
    act(() => WorkerFalso.ultimo?.onerror?.({ message: 'boom', error: new Error('boom') }))
    expect(result.current.posiciones).toBeNull()
    expect(result.current.error).toBe('boom')
  })
})
