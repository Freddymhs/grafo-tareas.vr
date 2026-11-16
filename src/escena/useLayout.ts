import { useEffect, useState } from 'react'
import type { Grafo, Posicion } from '../lib/dominio'
import { LINEAS_MINIMAS } from '../lib/constants/etiquetas'
import { RADIO_PANORAMA, VUELTA } from '../lib/layout'
import type { PedidoLayout, RespuestaLayout } from '../lib/layout.worker'
import { registrarError } from '../lib/registro'

interface Resultado {
  readonly grafo: Grafo
  readonly posiciones: ReadonlyMap<string, Posicion> | null
  /** El mensaje del Worker si falló; sin él el layout no llega nunca y el mapa quedaría «acomodando» para siempre. */
  readonly error: string | null
}

export interface LayoutCalculado {
  readonly posiciones: ReadonlyMap<string, Posicion> | null
  readonly error: string | null
}

const SIN_LAYOUT: LayoutCalculado = { posiciones: null, error: null }

/**
 * Las posiciones del grafo, calculadas en un Worker; `posiciones` es `null` mientras se calculan o si no hay grafo que
 * calcular (`null` de entrada: el mapa ya está guardado y no hace falta el layout de fuerzas). Si el Worker falla,
 * `error` lleva el motivo y se registra.
 */
export function useLayout(
  grafo: Grafo | null,
  radio: number = RADIO_PANORAMA,
  abertura: number = VUELTA,
  lineas: number = LINEAS_MINIMAS,
): LayoutCalculado {
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    if (!grafo) return
    const worker = new Worker(new URL('../lib/layout.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = ({ data }: MessageEvent<RespuestaLayout>) =>
      setResultado({ grafo, posiciones: new Map(data), error: null })
    worker.onerror = (evento: ErrorEvent) => {
      const error = registrarError(
        'calcular el layout en el Worker',
        evento.error ?? evento.message,
      )
      setResultado({ grafo, posiciones: null, error })
    }
    const pedido: PedidoLayout = { grafo, radio, abertura, lineas }
    worker.postMessage(pedido)
    return () => worker.terminate()
  }, [grafo, radio, abertura, lineas])

  // Un resultado de otro grafo (el anterior) no vale: se deriva, no se borra con un efecto.
  if (!resultado || resultado.grafo !== grafo) return SIN_LAYOUT
  return { posiciones: resultado.posiciones, error: resultado.error }
}
