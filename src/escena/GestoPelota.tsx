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
import { curvatura, esPoseDePelota, type Punto } from '../lib/pose-mano'

/** El arco, abajo al centro del campo de visión. */
const DELANTE = new Vector3(0, -0.12, -0.6)
const RADIO_INTERNO = 0.03
const RADIO_EXTERNO = 0.04
const SEGMENTOS = 32
const COLOR_ARCO = '#38bdf8'
/** Por debajo de esto no se muestra: la mano siempre se mueve un poco. */
const PROGRESO_VISIBLE = 0.3
/** El progreso se redondea a décimos: re-renderizar en cada frame no hace falta para un arco. */
const PASOS_DE_PROGRESO = 10
/** `?depurar`: cuántas muestras se guardan (~1 min a 72 Hz) para calibrar los umbrales con datos reales. */
const MUESTRAS_DEPURACION = 4320
const ARTICULACIONES_DEDO = [
  'metacarpal',
  'phalanx-proximal',
  'phalanx-intermediate',
  'phalanx-distal',
  'tip',
] as const
const DEDOS = ['index-finger', 'middle-finger', 'ring-finger'] as const

export interface MuestraDepuracion {
  readonly t: number
  readonly angulo: number
  readonly progreso: number
  readonly evento: string | null
  /** Cuánto se doblan el índice, el medio y el anular (0 estirado → 1 cerrado). */
  readonly curvaturas: readonly number[]
  /** Distancia (m) entre las puntas del pulgar y del índice. */
  readonly pulgarIndice: number
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
  const cambiarPagina = useEstadoVr((estado) => estado.cambiarPagina)
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
    if (!frame || !muneca || !espacio) return
    const pose = frame.getJointPose?.(muneca, espacio)
    if (!pose) {
      medicion.current.anterior = null
      return
    }
    const punto = (articulacion: XRHandJoint): Punto | null => {
      const espacioArticulacion = mano?.inputSource.hand.get(articulacion)
      const p = espacioArticulacion ? frame.getJointPose?.(espacioArticulacion, espacio) : undefined
      return p ? p.transform.position : null
    }
    const curvaturas = DEDOS.map((dedo) => {
      const puntos = ARTICULACIONES_DEDO.map((a) => punto(`${dedo}-${a}`))
      return puntos.every((p): p is Punto => p !== null) ? curvatura(puntos) : Number.NaN
    })
    const pulgar = punto('thumb-tip')
    const indice = punto('index-finger-tip')
    const pulgarIndice =
      pulgar && indice
        ? Math.hypot(pulgar.x - indice.x, pulgar.y - indice.y, pulgar.z - indice.z)
        : Number.NaN
    const { x, y, z, w } = pose.transform.orientation
    const ahora = new Quaternion(x, y, z, w)
    const { anterior } = medicion.current
    const angulo = medicion.current.angulo + (anterior ? giroVertical(anterior, ahora) : 0)
    medicion.current = { angulo, anterior: ahora }

    const enPose = esPoseDePelota(curvaturas)
    const paso = avanzarGesto(gesto.current, { t: clock.elapsedTime, angulo, enPose })
    gesto.current = paso.estado
    if (paso.evento) cambiarPagina(paso.evento === 'siguiente' ? 1 : -1, total)
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
