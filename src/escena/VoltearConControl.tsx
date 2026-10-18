// Apretar el stick del control izquierdo (FASE 17): da vuelta la hoja de la HU, sin apuntar. Cuenta el momento en que
// se aprieta (no mientras se mantiene): un toque, una vuelta. Con las manos libres lo hará la mano abierta que sube.
import { useFrame } from '@react-three/fiber'
import { useXRInputSourceState } from '@react-three/xr'
import { useRef } from 'react'

const BOTON_VOLTEAR = 'xr-standard-thumbstick'

export function VoltearConControl({ onVoltear }: { readonly onVoltear: () => void }) {
  const control = useXRInputSourceState('controller', 'left')
  const apretado = useRef(false)

  useFrame(() => {
    const ahora = control?.gamepad[BOTON_VOLTEAR]?.state === 'pressed'
    if (ahora && !apretado.current) onVoltear()
    apretado.current = ahora
  })

  return null
}
