// Todos los nodos en UNA draw call (FASE 1, D2): `<Instances>` de drei, color y escala por instancia.

import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { EstadoNodo, TipoNodo, type Nodo, type Posicion } from '../lib/dominio'

const RADIO_NODO = 0.05
const SEGMENTOS_ESFERA = 12
const ESCALA_CERRADO = 0.5
const ESCALA_BLOQUEANTE = 1.8
const ESCALA_SELECCIONADO = 2.2
const BLOQUEANTES: ReadonlySet<string> = new Set([TipoNodo.PERSONA, TipoNodo.DUDA, TipoNodo.RAMA])

interface Props {
  readonly nodos: readonly Nodo[]
  readonly posiciones: ReadonlyMap<string, Posicion>
  readonly colores: ReadonlyMap<string, string>
  readonly seleccionado: string | null
  readonly onSeleccionar: (id: string) => void
}

function escalaDe(nodo: Nodo, seleccionado: string | null): number {
  if (nodo.id === seleccionado) return ESCALA_SELECCIONADO
  if (BLOQUEANTES.has(nodo.tipo)) return ESCALA_BLOQUEANTE
  return nodo.estado === EstadoNodo.CERRADO ? ESCALA_CERRADO : 1
}

export function Nodos({ nodos, posiciones, colores, seleccionado, onSeleccionar }: Props) {
  return (
    <Instances limit={nodos.length} range={nodos.length}>
      <sphereGeometry args={[RADIO_NODO, SEGMENTOS_ESFERA, SEGMENTOS_ESFERA]} />
      <meshStandardMaterial />
      {nodos.map((nodo) => {
        const { x, y, z } = posiciones.get(nodo.id) ?? { x: 0, y: 0, z: 0 }
        const seleccionar = (evento: ThreeEvent<MouseEvent>) => {
          evento.stopPropagation()
          onSeleccionar(nodo.id)
        }
        return (
          <Instance
            key={nodo.id}
            position={[x, y, z]}
            color={colores.get(nodo.id)}
            scale={escalaDe(nodo, seleccionado)}
            onClick={seleccionar}
          />
        )
      })}
    </Instances>
  )
}
