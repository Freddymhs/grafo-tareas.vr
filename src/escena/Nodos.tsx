// Todos los nodos en UNA draw call (FASE 1, D2): `<Instances>` de drei, color y escala por instancia.

import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { EstadoNodo, TipoNodo, type Nodo, type Posicion } from '../lib/dominio'

const RADIO_NODO = 0.05
const SEGMENTOS_ESFERA = 12
const ESCALA_CERRADO = 0.5
const ESCALA_BLOQUEANTE = 1.8
const ESCALA_SELECCIONADO = 2.2
/** Lo que se liberó al cerrar (FASE 7): más grande y en verde, para que se vea qué destrabó. */
const ESCALA_RESALTADO = 1.9
const COLOR_RESALTADO = '#4ade80'
const BLOQUEANTES: ReadonlySet<string> = new Set([TipoNodo.PERSONA, TipoNodo.DUDA, TipoNodo.RAMA])
/** El esqueleto del árbol (FASE 13): la HU es el centro de su racimo; la FASE, un nudo entre la HU y sus tarjetas. */
const ESCALA_HISTORIA = 3.2
const ESCALA_FASE = 1.5

interface Props {
  readonly nodos: readonly Nodo[]
  readonly posiciones: ReadonlyMap<string, Posicion>
  readonly colores: ReadonlyMap<string, string>
  readonly seleccionado: string | null
  readonly resaltados: ReadonlySet<string>
  readonly onSeleccionar: (id: string) => void
  /** El rayo pasa por encima (o se va, `null`): sin tocar, para ampliar el texto. */
  readonly onApuntar: (id: string | null) => void
}

function escalaDe(
  nodo: Nodo,
  seleccionado: string | null,
  resaltados: ReadonlySet<string>,
): number {
  if (nodo.id === seleccionado) return ESCALA_SELECCIONADO
  if (resaltados.has(nodo.id)) return ESCALA_RESALTADO
  if (nodo.tipo === TipoNodo.HISTORIA) return ESCALA_HISTORIA
  if (nodo.tipo === TipoNodo.FASE) return ESCALA_FASE
  if (BLOQUEANTES.has(nodo.tipo)) return ESCALA_BLOQUEANTE
  return nodo.estado === EstadoNodo.CERRADO ? ESCALA_CERRADO : 1
}

export function Nodos({
  nodos,
  posiciones,
  colores,
  seleccionado,
  resaltados,
  onSeleccionar,
  onApuntar,
}: Props) {
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
            color={resaltados.has(nodo.id) ? COLOR_RESALTADO : colores.get(nodo.id)}
            scale={escalaDe(nodo, seleccionado, resaltados)}
            onClick={seleccionar}
            onPointerOver={(evento: ThreeEvent<PointerEvent>) => {
              evento.stopPropagation()
              onApuntar(nodo.id)
            }}
            onPointerOut={() => onApuntar(null)}
          />
        )
      })}
    </Instances>
  )
}
