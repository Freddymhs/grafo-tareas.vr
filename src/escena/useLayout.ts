import { useEffect, useState } from 'react'
import type { Grafo, Posicion } from '../lib/dominio'
import type { RespuestaLayout } from '../lib/layout.worker'

interface Resultado {
  readonly grafo: Grafo
  readonly posiciones: ReadonlyMap<string, Posicion>
}

/**
 * Las posiciones del grafo, calculadas en un Worker; `null` mientras se calculan o si no hay grafo que calcular
 * (`null` de entrada: el mapa ya está guardado y no hace falta el layout de fuerzas).
 */
export function useLayout(grafo: Grafo | null): ReadonlyMap<string, Posicion> | null {
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    if (!grafo) return
    const worker = new Worker(new URL('../lib/layout.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = ({ data }: MessageEvent<RespuestaLayout>) =>
      setResultado({ grafo, posiciones: new Map(data) })
    worker.postMessage(grafo)
    return () => worker.terminate()
  }, [grafo])

  // Un resultado de otro grafo (el anterior) no vale: se deriva, no se borra con un efecto.
  return resultado && resultado.grafo === grafo ? resultado.posiciones : null
}
