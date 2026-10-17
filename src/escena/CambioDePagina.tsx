// X / Y del control izquierdo (FASE 15): la HU siguiente / la anterior, sin apuntar. Cuenta el momento en que se aprieta
// (no mientras se mantiene): un toque, una página. Con las manos libres lo hará girar la pelota.
import { useFrame } from '@react-three/fiber'
import { useXRInputSourceState } from '@react-three/xr'
import { useRef } from 'react'
import { useEstadoVr } from '../lib/estado-vr'

const BOTON_SIGUIENTE = 'x-button'
const BOTON_ANTERIOR = 'y-button'

export function CambioDePagina({ total }: { readonly total: number }) {
  const control = useXRInputSourceState('controller', 'left')
  const cambiarPagina = useEstadoVr((estado) => estado.cambiarPagina)
  const apretados = useRef({ siguiente: false, anterior: false })

  useFrame(() => {
    const siguiente = control?.gamepad[BOTON_SIGUIENTE]?.state === 'pressed'
    const anterior = control?.gamepad[BOTON_ANTERIOR]?.state === 'pressed'
    if (siguiente && !apretados.current.siguiente) cambiarPagina(1, total)
    if (anterior && !apretados.current.anterior) cambiarPagina(-1, total)
    apretados.current = { siguiente, anterior }
  })

  return null
}
