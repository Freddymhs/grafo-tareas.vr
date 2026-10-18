// Mostrar un número con la mano DERECHA (FASE 17): en cada frame mide cuánto se dobla cada uno de los cinco dedos,
// lee qué forma hace (`numeroDeLaMano`) y, SOLO con la mano levantada (`esManoAlzada`), decide con
// `lib/conteo-dedos.ts` y avisa por `onNumero`. Qué hace cada número lo conecta quien integra. Mientras se sostiene
// aparece el número abajo a la derecha del campo de visión, con una barrita que se llena (te entendió).
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useXR, useXRInputSourceState } from '@react-three/xr'
import { useRef, useState } from 'react'
import { Vector3, type Group } from 'three'
import {
  NUMERO_INICIAL,
  avanzarNumero,
  numeroDeLaMano,
  type CurvaturasMano,
} from '../lib/conteo-dedos'
import { esManoAlzada } from '../lib/pose-mano'
import { MUESTRAS_DEPURACION, PASOS_DE_PROGRESO, PROGRESO_VISIBLE, curvaturaDe } from './mano-xr'

/** El indicador, abajo a la derecha del campo de visión: lejos del arco de la pelota (x = 0) y de la barrita de voltear (x = 0,08). */
const DELANTE = new Vector3(0.16, -0.12, -0.6)
const TAMANO_NUMERO = 0.03
const ANCHO_BARRA = 0.03
const ALTO_BARRA = 0.004
const SEPARACION = 0.006
const COLOR = '#fbbf24'

export interface MuestraDepuracionNumero {
  readonly t: number
  readonly curvaturas: CurvaturasMano
  readonly numero: number
  readonly alzada: boolean
  readonly progreso: number
  readonly evento: number | null
}

declare global {
  interface Window {
    __gestoNumero?: MuestraDepuracionNumero[]
  }
}

interface Indicador {
  readonly numero: number
  readonly progreso: number
}

const INDICADOR_OCULTO: Indicador = { numero: 0, progreso: 0 }

export function GestoNumero({
  onNumero,
  depurar,
}: {
  readonly onNumero: (n: number) => void
  readonly depurar: boolean
}) {
  const mano = useXRInputSourceState('hand', 'right')
  const espacio = useXR((xr) => xr.originReferenceSpace)
  const gesto = useRef(NUMERO_INICIAL)
  const grupo = useRef<Group>(null)
  const [indicador, setIndicador] = useState(INDICADOR_OCULTO)

  useFrame(({ camera, clock }, _delta, frame?: XRFrame) => {
    const muneca = mano?.inputSource.hand.get('wrist')
    if (!frame || !mano || !muneca || !espacio) return
    const pose = frame.getJointPose?.(muneca, espacio)
    if (!pose) return
    const { hand } = mano.inputSource
    const curvaturas: CurvaturasMano = {
      pulgar: curvaturaDe(frame, hand, espacio, 'thumb'),
      indice: curvaturaDe(frame, hand, espacio, 'index-finger'),
      medio: curvaturaDe(frame, hand, espacio, 'middle-finger'),
      anular: curvaturaDe(frame, hand, espacio, 'ring-finger'),
      menique: curvaturaDe(frame, hand, espacio, 'pinky-finger'),
    }
    const numero = numeroDeLaMano(curvaturas)
    const alzada = esManoAlzada(pose.transform.position.y, camera.position.y)
    const paso = avanzarNumero(gesto.current, { t: clock.elapsedTime, numero, alzada })
    gesto.current = paso.estado
    if (paso.evento !== null) onNumero(paso.evento)
    const redondeado = Math.round(paso.progreso * PASOS_DE_PROGRESO) / PASOS_DE_PROGRESO
    setIndicador((actual) =>
      actual.numero === numero && actual.progreso === redondeado
        ? actual
        : { numero, progreso: redondeado },
    )
    if (depurar) {
      // Diagnóstico, no lógica: un búfer que se lee por la depuración remota del navegador del Quest.
      const muestras = window.__gestoNumero ?? []
      muestras.push({
        t: clock.elapsedTime,
        curvaturas,
        numero,
        alzada,
        progreso: paso.progreso,
        evento: paso.evento,
      })
      window.__gestoNumero = muestras.slice(-MUESTRAS_DEPURACION)
    }

    if (grupo.current) {
      grupo.current.position.copy(DELANTE).applyQuaternion(camera.quaternion).add(camera.position)
      grupo.current.quaternion.copy(camera.quaternion)
    }
  })

  // La barra crece de izquierda a derecha: el plano se centra, así que se corre medio ancho lleno hacia la derecha.
  const anchoLleno = indicador.progreso * ANCHO_BARRA
  return (
    <group ref={grupo}>
      {indicador.progreso >= PROGRESO_VISIBLE ? (
        <>
          <Text
            fontSize={TAMANO_NUMERO}
            color={COLOR}
            anchorX="center"
            anchorY="bottom"
            position={[0, SEPARACION, 0]}
          >
            {String(indicador.numero)}
          </Text>
          <mesh position={[(anchoLleno - ANCHO_BARRA) / 2, 0, 0]}>
            <planeGeometry args={[anchoLleno, ALTO_BARRA]} />
            <meshBasicMaterial color={COLOR} />
          </mesh>
        </>
      ) : null}
    </group>
  )
}
