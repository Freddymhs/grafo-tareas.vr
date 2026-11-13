// El botón B del control derecho (FASE 17): pasa al filtro siguiente entre los del espacio (FASE 26: sin filtros, nada),
// sin mostrar dedos. Cuenta el momento en que se aprieta (no mientras se mantiene): un toque, un cambio. Con las manos
// libres lo eligen los dedos (`GestoNumero`).
import { useFrame } from '@react-three/fiber'
import { useXRInputSourceState } from '@react-three/xr'
import { useRef } from 'react'
import { useEstadoVr } from '../lib/estado-vr'
import { useFiltroVr } from './useFiltroVr'

const BOTON_FILTRO = 'b-button'

export function FiltroConControl() {
  const control = useXRInputSourceState('controller', 'right')
  const alternarFiltro = useEstadoVr((estado) => estado.alternarFiltro)
  const { filtros } = useFiltroVr()
  const apretado = useRef(false)

  useFrame(() => {
    const ahora = control?.gamepad[BOTON_FILTRO]?.state === 'pressed'
    if (ahora && !apretado.current) alternarFiltro(filtros)
    apretado.current = ahora
  })

  return null
}
