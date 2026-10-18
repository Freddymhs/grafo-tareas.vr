// Dar vuelta la hoja con la mano izquierda (FASE 17): en cada frame mide la altura de la muñeca y, SOLO con la mano
// abierta (`esManoAbierta`) y a la altura del hombro (`esManoAlzada`), decide con `lib/gesto-voltear.ts` y avisa por `onVoltear`. Con los controles en la mano
// el Quest no ve los dedos: ahí está el stick (`VoltearConControl`). Mientras sube aparece una barrita a la derecha
// del arco de la pelota que se va llenando hacia arriba (te entendió); llena, da vuelta la hoja.
import { useFrame } from '@react-three/fiber'
import { useXR, useXRInputSourceState } from '@react-three/xr'
import { useRef, useState } from 'react'
import { Vector3, type Group } from 'three'
import { VOLTEAR_INICIAL, avanzarVoltear } from '../lib/gesto-voltear'
import { esManoAbierta, esManoAlzada } from '../lib/pose-mano'
import { MUESTRAS_DEPURACION, PASOS_DE_PROGRESO, PROGRESO_VISIBLE, curvaturasDe } from './mano-xr'

/** La barrita, abajo al centro del campo de visión, a la derecha del arco de la pelota (que está en x = 0). */
const DELANTE = new Vector3(0.08, -0.12, -0.6)
const ANCHO_BARRA = 0.008
const ALTO_BARRA = 0.06
const COLOR_BARRA = '#a3e635'

export interface MuestraDepuracionVoltear {
  readonly t: number
  readonly altura: number
  readonly abierta: boolean
  readonly progreso: number
  readonly evento: string | null
  /** Cuánto se doblan el índice, el medio y el anular (0 estirado → 1 cerrado). */
  readonly curvaturas: readonly number[]
}

declare global {
  interface Window {
    __gestoVoltear?: MuestraDepuracionVoltear[]
  }
}

export function GestoVoltear({
  onVoltear,
  depurar,
}: {
  readonly onVoltear: () => void
  readonly depurar: boolean
}) {
  const mano = useXRInputSourceState('hand', 'left')
  const espacio = useXR((xr) => xr.originReferenceSpace)
  const gesto = useRef(VOLTEAR_INICIAL)
  const barra = useRef<Group>(null)
  const [progreso, setProgreso] = useState(0)

  useFrame(({ camera, clock }, _delta, frame?: XRFrame) => {
    const muneca = mano?.inputSource.hand.get('wrist')
    if (!frame || !mano || !muneca || !espacio) return
    const pose = frame.getJointPose?.(muneca, espacio)
    if (!pose) return
    const curvaturas = curvaturasDe(frame, mano.inputSource.hand, espacio)
    const altura = pose.transform.position.y
    const abierta = esManoAbierta(curvaturas)
    const alzada = esManoAlzada(altura, camera.position.y)
    const paso = avanzarVoltear(gesto.current, { t: clock.elapsedTime, altura, abierta, alzada })
    gesto.current = paso.estado
    if (paso.evento) onVoltear()
    const redondeado = Math.round(paso.progreso * PASOS_DE_PROGRESO) / PASOS_DE_PROGRESO
    setProgreso((actual) => (actual === redondeado ? actual : redondeado))
    if (depurar) {
      // Diagnóstico, no lógica: un búfer que se lee por la depuración remota del navegador del Quest.
      const muestras = window.__gestoVoltear ?? []
      muestras.push({
        t: clock.elapsedTime,
        altura,
        abierta,
        progreso: paso.progreso,
        evento: paso.evento,
        curvaturas,
      })
      window.__gestoVoltear = muestras.slice(-MUESTRAS_DEPURACION)
    }

    if (barra.current) {
      barra.current.position.copy(DELANTE).applyQuaternion(camera.quaternion).add(camera.position)
      barra.current.quaternion.copy(camera.quaternion)
    }
  })

  // La barra crece desde abajo: el plano se centra, así que se corre media altura llena hacia arriba.
  const altoLleno = progreso * ALTO_BARRA
  return (
    <group ref={barra}>
      {progreso >= PROGRESO_VISIBLE ? (
        <mesh position={[0, (altoLleno - ALTO_BARRA) / 2, 0]}>
          <planeGeometry args={[ANCHO_BARRA, altoLleno]} />
          <meshBasicMaterial color={COLOR_BARRA} />
        </mesh>
      ) : null}
    </group>
  )
}
