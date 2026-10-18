// Todos los nodos en UNA draw call (FASE 1, D2): `<Instances>` de drei, color y escala por instancia.

import { Instance, Instances } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { LIMITE_GRAFO } from '../lib/constants/api'
import { RADIO_NODO } from '../lib/constants/grafo'
import type { Nodo, Posicion } from '../lib/dominio'
import { escalaDe } from '../lib/escala-nodo'

const SEGMENTOS_ESFERA = 12
/** Lo que se liberó al cerrar (FASE 7): en verde, para que se vea qué destrabó (el tamaño, en `escala-nodo`). */
const COLOR_RESALTADO = '#4ade80'

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

export function Nodos({
  nodos,
  posiciones,
  colores,
  seleccionado,
  resaltados,
  onSeleccionar,
  onApuntar,
}: Props) {
  // `<Instances>` arma sus buffers UNA vez, con el `limit` del primer render. Con el tamaño de la página como límite,
  // pasar de una página chica a una grande dejaba las esferas de más sin posición, encima de la cabeza (en el visor,
  // 2026-10-18: HU 20379 → HU 19565, sin esferas y 20 FPS). La capacidad es la de la API; si un grafo la pasa, se rearma.
  const capacidad = Math.max(LIMITE_GRAFO, nodos.length)
  return (
    <Instances key={capacidad} limit={capacidad} range={nodos.length}>
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
