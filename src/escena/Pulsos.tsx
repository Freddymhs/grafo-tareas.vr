// Las líneas como camino (idea de Freddy, 26-10). Por cada relación que todavía frena —depende de, bloqueada
// por, espera respuesta de— un punto de luz viaja desde lo que hay que hacer antes hacia lo que lo espera: el ojo sigue
// el movimiento y lee «primero esto, después aquello» sin texto. Qué frena lo dice la API (`frenan` de
// la página); acá solo se anima. Sirve en toda página y en las dos caras.
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Object3D, type InstancedMesh } from 'three'
import type { Conexion, Posicion } from '../lib/dominio'

const RADIO_PULSO = 0.014
const SEGMENTOS = 8
const COLOR_PULSO = '#fde68a'
/** Segundos que tarda un pulso en recorrer su línea: lento, para que se siga con la vista sin cansar. */
const DURACION_S = 2.4
/** Cada línea arranca en otro momento: que no laten todas a la vez. */
const DESFASE = 0.37

interface Props {
  readonly conexiones: readonly Conexion[]
  readonly posiciones: ReadonlyMap<string, Posicion>
  readonly frenan: ReadonlySet<string> | null
}

export function Pulsos({ conexiones, posiciones, frenan }: Props) {
  const malla = useRef<InstancedMesh>(null)
  const marcador = useMemo(() => new Object3D(), [])
  const tramos = useMemo(
    () =>
      conexiones.flatMap(({ origenId, destinoId }) => {
        const antes = posiciones.get(destinoId)
        const despues = posiciones.get(origenId)
        const frena = frenan?.has(destinoId) ?? false
        return antes && despues && frena ? [{ antes, despues }] : []
      }),
    [conexiones, posiciones, frenan],
  )

  useFrame(({ clock }) => {
    const mesh = malla.current
    if (!mesh) return
    tramos.forEach(({ antes, despues }, i) => {
      const t = (clock.elapsedTime / DURACION_S + i * DESFASE) % 1
      marcador.position.set(
        antes.x + (despues.x - antes.x) * t,
        antes.y + (despues.y - antes.y) * t,
        antes.z + (despues.z - antes.z) * t,
      )
      marcador.updateMatrix()
      mesh.setMatrixAt(i, marcador.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  if (tramos.length === 0) return null
  return (
    <instancedMesh
      key={tramos.length}
      ref={malla}
      args={[undefined, undefined, tramos.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[RADIO_PULSO, SEGMENTOS, SEGMENTOS]} />
      <meshBasicMaterial color={COLOR_PULSO} />
    </instancedMesh>
  )
}
