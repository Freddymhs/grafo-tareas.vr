// El nodo seleccionado: su título y qué lo bloquea (FASE 1, criterio 3).

import { Billboard, Text } from '@react-three/drei'
import { bloqueadoPor } from '../lib/bloqueo'
import type { Grafo, Posicion } from '../lib/dominio'

const TAMANO_TITULO = 0.06
const TAMANO_DETALLE = 0.04
const DESPLAZAMIENTO_Y = 0.16
const ANCHO_MAXIMO = 1.2
const COLOR_TITULO = '#ffffff'
const COLOR_BLOQUEO = '#fca5a5'
const COLOR_LIBRE = '#86efac'
const SEPARACION = 0.02

interface Props {
  readonly grafo: Grafo
  readonly id: string
  readonly posicion: Posicion
}

export function Seleccion({ grafo, id, posicion }: Props) {
  const nodo = grafo.nodos.find((n) => n.id === id)
  if (!nodo) return null
  const bloqueos = bloqueadoPor(grafo, id)
  const estaLibre = bloqueos.length === 0
  const detalle = estaLibre
    ? 'Libre: nada lo bloquea'
    : `Bloqueado por: ${bloqueos.map((b) => b.titulo).join(' · ')}`
  const { x, y, z } = posicion

  return (
    <Billboard position={[x, y + DESPLAZAMIENTO_Y, z]}>
      <Text fontSize={TAMANO_TITULO} color={COLOR_TITULO} anchorY="bottom" maxWidth={ANCHO_MAXIMO}>
        {`${nodo.titulo} · ${nodo.estado}`}
      </Text>
      <Text
        position={[0, -SEPARACION, 0]}
        fontSize={TAMANO_DETALLE}
        color={estaLibre ? COLOR_LIBRE : COLOR_BLOQUEO}
        anchorY="top"
        maxWidth={ANCHO_MAXIMO}
      >
        {detalle}
      </Text>
    </Billboard>
  )
}
