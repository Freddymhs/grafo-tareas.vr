// FPS visibles DENTRO del visor (FASE 1, tarea 5): r3f-perf es un overlay HTML y en VR no se ve.
// Un texto que sigue a la cabeza, abajo a la izquierda del campo de visión, actualizado una vez por segundo.

import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Group, Vector3 } from 'three'

const SEGUNDOS_VENTANA = 1
const DELANTE = new Vector3(-0.25, -0.2, -0.8)
const TAMANO = 0.025
const FPS_OBJETIVO = 72
const COLOR_OK = '#86efac'
const COLOR_BAJO = '#fca5a5'

interface Props {
  readonly nodos: number
  readonly conexiones: number
}

export function Medidor({ nodos, conexiones }: Props) {
  const grupo = useRef<Group>(null)
  const ventana = useRef({ inicio: 0, frames: 0 })
  const [fps, setFps] = useState(0)

  useFrame(({ camera, clock }) => {
    // La ventana es un contador por frame: vive en un ref para no re-renderizar 72 veces por segundo.
    ventana.current.frames += 1
    const transcurrido = clock.elapsedTime - ventana.current.inicio
    if (transcurrido >= SEGUNDOS_VENTANA) {
      setFps(Math.round(ventana.current.frames / transcurrido))
      ventana.current = { inicio: clock.elapsedTime, frames: 0 }
    }
    if (grupo.current) {
      grupo.current.position.copy(DELANTE).applyQuaternion(camera.quaternion).add(camera.position)
      grupo.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group ref={grupo}>
      <Text fontSize={TAMANO} color={fps >= FPS_OBJETIVO ? COLOR_OK : COLOR_BAJO} anchorX="left">
        {`${fps} FPS · ${nodos} nodos · ${conexiones} aristas`}
      </Text>
    </group>
  )
}
