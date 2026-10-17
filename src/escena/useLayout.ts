import { useEffect, useState } from 'react'
import type { Grafo, Posicion } from '../lib/dominio'
import type { RespuestaLayout } from '../lib/layout.worker'

/** Las posiciones del grafo, calculadas en un Worker; `null` mientras se calculan. */
export function useLayout(grafo: Grafo): ReadonlyMap<string, Posicion> | null {
  const [posiciones, setPosiciones] = useState<ReadonlyMap<string, Posicion> | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('../lib/layout.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = ({ data }: MessageEvent<RespuestaLayout>) => setPosiciones(new Map(data))
    worker.postMessage(grafo)
    return () => worker.terminate()
  }, [grafo])

  return posiciones
}
