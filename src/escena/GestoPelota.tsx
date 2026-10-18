// Girar la pelota con la mano izquierda (FASE 15): en cada frame mide cuánto giró la muñeca alrededor del eje VERTICAL
// —sea la mano vertical u horizontal—, lo acumula y, SOLO con la mano como agarrando una pelota (`esPoseDePelota`),
// decide con `lib/gesto-pelota.ts` y cambia de HU. Con los controles en la mano el Quest no ve los dedos: ahí están X / Y.
// Mientras se gira aparece un arco abajo al centro que se va llenando (te entendió); lleno, cambia la página.
import { useFrame } from '@react-three/fiber'
import { useXR, useXRInputSourceState } from '@react-three/xr'
import { useRef, useState } from 'react'
import { Quaternion, Vector3, type Group } from 'three'
import { giroVertical } from '../lib/giro-vertical'
import { useEstadoVr } from '../lib/estado-vr'
import { GESTO_INICIAL, avanzarGesto } from '../lib/gesto-pelota'
import { esManoAlzada, esPoseDePelota } from '../lib/pose-mano'
import {
  MUESTRAS_DEPURACION,
  PASOS_DE_PROGRESO,
  PROGRESO_VISIBLE,
  curvaturasDe,
  puntoDe,
} from './mano-xr'

/** El arco, abajo al centro del campo de visión. */
const DELANTE = new Vector3(0, -0.12, -0.6)
const RADIO_INTERNO = 0.03
const RADIO_EXTERNO = 0.04
const SEGMENTOS = 32
const COLOR_ARCO = '#38bdf8'

export interface MuestraDepuracion {
  readonly t: number
  readonly angulo: number
  readonly progreso: number
  readonly evento: string | null
  /** Cuánto se doblan el índice, el medio y el anular (0 estirado → 1 cerrado). */
  readonly curvaturas: readonly number[]
  /** Distancia (m) entre las puntas del pulgar y del índice. */
  readonly pulgarIndice: number
  /** Cuánto por debajo de los ojos está la muñeca (m): para calibrar `esManoAlzada`. */
  readonly bajoLosOjos: number
}

declare global {
  interface Window {
    __gestoPelota?: MuestraDepuracion[]
  }
}

export function GestoPelota({
  total,
  depurar,
}: {
  readonly total: number
  readonly depurar: boolean
}) {
  const mano = useXRInputSourceState('hand', 'left')
  const espacio = useXR((xr) => xr.originReferenceSpace)
  const cambiarLibro = useEstadoVr((estado) => estado.cambiarLibro)
  const gesto = useRef(GESTO_INICIAL)
  // El giro acumulado y la orientación anterior: estado de la medición, frame a frame.
  const medicion = useRef<{ angulo: number; anterior: Quaternion | null }>({
    angulo: 0,
    anterior: null,
  })
  const arco = useRef<Group>(null)
  const [progreso, setProgreso] = useState(0)

  useFrame(({ camera, clock }, _delta, frame?: XRFrame) => {
    const muneca = mano?.inputSource.hand.get('wrist')
    if (!frame || !mano || !muneca || !espacio) return
    const pose = frame.getJointPose?.(muneca, espacio)
    if (!pose) {
      medicion.current.anterior = null
      return
    }
    const curvaturas = curvaturasDe(frame, mano.inputSource.hand, espacio)
    const pulgar = puntoDe(frame, mano.inputSource.hand, espacio, 'thumb-tip')
    const indice = puntoDe(frame, mano.inputSource.hand, espacio, 'index-finger-tip')
    const pulgarIndice =
      pulgar && indice
        ? Math.hypot(pulgar.x - indice.x, pulgar.y - indice.y, pulgar.z - indice.z)
        : Number.NaN
    const { x, y, z, w } = pose.transform.orientation
    const ahora = new Quaternion(x, y, z, w)
    const { anterior } = medicion.current
    const angulo = medicion.current.angulo + (anterior ? giroVertical(anterior, ahora) : 0)
    medicion.current = { angulo, anterior: ahora }

    const bajoLosOjos = camera.position.y - pose.transform.position.y
    const enPose =
      esPoseDePelota(curvaturas) && esManoAlzada(pose.transform.position.y, camera.position.y)
    const paso = avanzarGesto(gesto.current, { t: clock.elapsedTime, angulo, enPose })
    gesto.current = paso.estado
    if (paso.evento) cambiarLibro(paso.evento === 'siguiente' ? 1 : -1, total)
    const redondeado = Math.round(paso.progreso * PASOS_DE_PROGRESO) / PASOS_DE_PROGRESO
    setProgreso((actual) => (actual === redondeado ? actual : redondeado))
    if (depurar) {
      // Diagnóstico, no lógica: un búfer que se lee por la depuración remota del navegador del Quest.
      const muestras = window.__gestoPelota ?? []
      muestras.push({
        t: clock.elapsedTime,
        angulo,
        progreso: paso.progreso,
        evento: paso.evento,
        curvaturas,
        pulgarIndice,
        bajoLosOjos,
      })
      window.__gestoPelota = muestras.slice(-MUESTRAS_DEPURACION)
    }

    if (arco.current) {
      arco.current.position.copy(DELANTE).applyQuaternion(camera.quaternion).add(camera.position)
      arco.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group ref={arco}>
      {progreso >= PROGRESO_VISIBLE ? (
        <mesh>
          <ringGeometry
            args={[RADIO_INTERNO, RADIO_EXTERNO, SEGMENTOS, 1, Math.PI / 2, progreso * 2 * Math.PI]}
          />
          <meshBasicMaterial color={COLOR_ARCO} />
        </mesh>
      ) : null}
    </group>
  )
}
