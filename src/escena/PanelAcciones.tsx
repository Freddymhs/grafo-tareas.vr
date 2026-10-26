// El panel del nodo seleccionado (FASE 7): cerrar o reabrir, y conectar apuntando al otro nodo con el rayo. Tomar una
// pieza del plan no va acá: la toma `/flow:pbi:get` al empezar la task, con su columna y su FASE (Freddy, 2026-10-26).
import { Billboard, Text } from '@react-three/drei'
import { TEXTO_CONEXION } from '../lib/constants/conexiones'
import { EstadoNodo, type Nodo, type Posicion } from '../lib/dominio'
import { CONEXIONES_DESDE_VR, useEstadoVr } from '../lib/estado-vr'
import { ALTO_BOTON, Boton3D } from './Boton3D'
import { useAccionesVr } from './useAccionesVr'

/** El panel cuelga debajo del nodo, para no tapar el título que va arriba. */
const DEBAJO_DEL_NODO = 0.16
const SEPARACION_BOTONES = ALTO_BOTON + 0.015
const TAMANO_AVISO = 0.03
const COLOR_AVISO = '#fde68a'
const COLOR_INSTRUCCION = '#93c5fd'

interface Props {
  readonly nodo: Nodo
  readonly posicion: Posicion
}

const fila = (indice: number): [number, number, number] => [0, -indice * SEPARACION_BOTONES, 0]

export function PanelAcciones({ nodo, posicion }: Props) {
  const modo = useEstadoVr((estado) => estado.modo)
  const aviso = useEstadoVr((estado) => estado.aviso)
  const empezarConexion = useEstadoVr((estado) => estado.empezarConexion)
  const cancelar = useEstadoVr((estado) => estado.cancelar)
  const { cerrar, reabrir, ocupado } = useAccionesVr()
  const cerrado = nodo.estado === EstadoNodo.CERRADO
  const { x, y, z } = posicion

  const botones =
    modo.tipo === 'conectando'
      ? [{ texto: 'Cancelar', onTocar: cancelar }]
      : [
          {
            texto: cerrado ? 'Reabrir' : 'Cerrar',
            onTocar: () => (cerrado ? reabrir(nodo.id) : cerrar(nodo.id)),
          },
          ...CONEXIONES_DESDE_VR.map((conexion) => ({
            texto: `Este ${TEXTO_CONEXION[conexion]}`,
            onTocar: () => empezarConexion(conexion),
          })),
        ]
  const textoAbajo =
    modo.tipo === 'conectando'
      ? {
          texto: `Este ${TEXTO_CONEXION[modo.conexion]} tocá el otro nodo`,
          color: COLOR_INSTRUCCION,
        }
      : aviso
        ? { texto: aviso, color: COLOR_AVISO }
        : null

  return (
    <Billboard position={[x, y - DEBAJO_DEL_NODO, z]}>
      {textoAbajo ? (
        <Text
          fontSize={TAMANO_AVISO}
          color={textoAbajo.color}
          anchorY="top"
          position={[0, -(botones.length - 0.5) * SEPARACION_BOTONES, 0]}
        >
          {textoAbajo.texto}
        </Text>
      ) : null}
      {botones.map(({ texto, onTocar }, indice) => (
        <Boton3D
          key={texto}
          texto={texto}
          posicion={fila(indice)}
          onTocar={onTocar}
          apagado={ocupado}
        />
      ))}
    </Billboard>
  )
}
