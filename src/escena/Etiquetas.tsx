// Etiquetas solo en los nodos más cercanos a la cabeza (FASE 1, D3): un `<Text>` por nodo no escala ni se lee.
// Se recalcula unas pocas veces por segundo, no en cada frame, y solo re-renderiza si cambió el conjunto.

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Nodo, Posicion } from '../lib/dominio'

export const ETIQUETAS_CERCANAS = 12
const SEGUNDOS_ENTRE_CALCULOS = 0.25
const TAMANO_TEXTO = 0.035
const DESPLAZAMIENTO_Y = 0.09
const COLOR_TEXTO = '#e2e8f0'

interface Props {
  readonly nodos: readonly Nodo[]
  readonly posiciones: ReadonlyMap<string, Posicion>
  readonly excluir: string | null
}

function mismosIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}

export function Etiquetas({ nodos, posiciones, excluir }: Props) {
  const [cercanos, setCercanos] = useState<readonly string[]>([])
  const ultimoCalculo = useRef(Number.NEGATIVE_INFINITY)

  useFrame(({ camera, clock }) => {
    if (clock.elapsedTime - ultimoCalculo.current < SEGUNDOS_ENTRE_CALCULOS) return
    ultimoCalculo.current = clock.elapsedTime
    const { x: cx, y: cy, z: cz } = camera.position
    const porDistancia = nodos
      .filter(({ id }) => id !== excluir)
      .map(({ id }) => {
        const { x, y, z } = posiciones.get(id) ?? { x: 0, y: 0, z: 0 }
        return { id, distancia: Math.hypot(x - cx, y - cy, z - cz) }
      })
      .sort((a, b) => a.distancia - b.distancia)
    const nuevos = porDistancia.slice(0, ETIQUETAS_CERCANAS).map(({ id }) => id)
    setCercanos((actuales) => (mismosIds(actuales, nuevos) ? actuales : nuevos))
  })

  const porId = new Map(nodos.map((nodo) => [nodo.id, nodo]))
  return (
    <>
      {cercanos.map((id) => {
        const { x, y, z } = posiciones.get(id) ?? { x: 0, y: 0, z: 0 }
        return (
          <Billboard key={id} position={[x, y + DESPLAZAMIENTO_Y, z]}>
            <Text fontSize={TAMANO_TEXTO} color={COLOR_TEXTO} anchorY="bottom">
              {porId.get(id)?.titulo ?? id}
            </Text>
          </Billboard>
        )
      })}
    </>
  )
}
