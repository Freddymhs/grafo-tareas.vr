// Cómo se mueve uno por el grafo. En el visor: stick izquierdo camina hacia donde se mira y el derecho gira a saltos
// (marea menos que el giro continuo); sin esto solo se podía caminar de verdad dentro del Guardian.
// En el escritorio: la órbita. Dentro del visor la órbita queda apagada: la cabeza ES la cámara, y si la órbita sigue
// reescribiéndola cada frame las etiquetas miran hacia ella y no hacia uno (se leían al revés).

import { OrbitControls } from '@react-three/drei'
import { XROrigin, useXR, useXRControllerLocomotion } from '@react-three/xr'
import { useRef } from 'react'
import type { Group } from 'three'

/** m/s: el grafo ocupa una esfera de RADIO_MUNDO (4 m), se cruza en ~5 s. */
const TRASLACION = { speed: 1.5 } as const
const GIRO = { type: 'snap', degrees: 30 } as const

interface Props {
  /** Estable (constante del módulo): OrbitControls compara el objetivo por referencia. */
  readonly objetivoOrbita: [number, number, number]
}

export function Movimiento({ objetivoOrbita }: Props) {
  const origen = useRef<Group>(null)
  const enVisor = useXR((xr) => xr.session !== undefined)
  useXRControllerLocomotion(origen, TRASLACION, GIRO)

  return (
    <>
      <XROrigin ref={origen} />
      {enVisor ? null : <OrbitControls target={objetivoOrbita} />}
    </>
  )
}
