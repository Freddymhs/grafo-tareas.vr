// El layout en un Web Worker (FASE 1, D4): medido el 2026-10-16, 500 nodos = 1175 ms en el PC, y el visor
// es más lento. Fuera del hilo principal la escena no se congela mientras se calcula.

import type { Grafo, Posicion } from './dominio'
import { calcularLayout } from './layout'

export type RespuestaLayout = ReadonlyArray<readonly [string, Posicion]>

export interface PedidoLayout {
  readonly grafo: Grafo
  readonly radio: number
}

self.onmessage = ({ data }: MessageEvent<PedidoLayout>) => {
  const respuesta: RespuestaLayout = [...calcularLayout(data.grafo, data.radio)]
  self.postMessage(respuesta)
}
