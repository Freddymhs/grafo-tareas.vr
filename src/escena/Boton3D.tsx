// Un botón dentro de la escena: se toca con el rayo del control (en el visor) o con el mouse (en el PC). Los
// eventos de puntero de @react-three/xr son los mismos onClick/onPointerOver de R3F.
import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useState } from 'react'

export const ANCHO_BOTON = 0.42
export const ALTO_BOTON = 0.075
const TAMANO_TEXTO = 0.032
const COLOR_FONDO = '#1e293b'
const COLOR_ENCIMA = '#334155'
const COLOR_APAGADO = '#0f172a'
const COLOR_TEXTO = '#f1f5f9'
const COLOR_TEXTO_APAGADO = '#64748b'
/** El texto apenas delante del fondo: sin esto parpadea (z-fighting). */
const DELANTE_DEL_FONDO = 0.001

interface Props {
  readonly texto: string
  readonly posicion: readonly [number, number, number]
  readonly onTocar: () => void
  readonly apagado?: boolean
}

export function Boton3D({ texto, posicion, onTocar, apagado = false }: Props) {
  const [encima, setEncima] = useState(false)
  const tocar = (evento: ThreeEvent<MouseEvent>) => {
    evento.stopPropagation()
    if (!apagado) onTocar()
  }
  const fondo = apagado ? COLOR_APAGADO : encima ? COLOR_ENCIMA : COLOR_FONDO
  return (
    <group position={[...posicion]}>
      <mesh
        onClick={tocar}
        onPointerOver={() => setEncima(true)}
        onPointerOut={() => setEncima(false)}
      >
        <planeGeometry args={[ANCHO_BOTON, ALTO_BOTON]} />
        <meshBasicMaterial color={fondo} />
      </mesh>
      <Text
        position={[0, 0, DELANTE_DEL_FONDO]}
        fontSize={TAMANO_TEXTO}
        color={apagado ? COLOR_TEXTO_APAGADO : COLOR_TEXTO}
        anchorX="center"
        anchorY="middle"
      >
        {texto}
      </Text>
    </group>
  )
}
