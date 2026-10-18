// El nodo seleccionado: su título y qué lo bloquea. El "qué lo bloquea" lo responde la API
// (`GET /nodos/:id/bloqueado`, decisión C1); en el sintético de la FASE 1 no hay API y no se muestra.

import { Billboard, Text } from '@react-three/drei'
import { useDerivadoControllerBloqueado } from '../lib/api/generado/derivado/derivado'
import type { Nodo, Posicion } from '../lib/dominio'
import { resumenDeEspera } from '../lib/seleccion'
import { LARGO_SELECCION, textoVisible } from '../lib/texto-visible'

const TAMANO_TITULO = 0.06
const TAMANO_DETALLE = 0.04
const DESPLAZAMIENTO_Y = 0.16
const ANCHO_MAXIMO = 1.2
const COLOR_TITULO = '#ffffff'
/** Ámbar suave con borde oscuro: el rojo sobre el fondo oscuro no se leía (Freddy, 2026-10-18). */
const COLOR_BLOQUEO = '#fcd34d'
const COLOR_LIBRE = '#86efac'
const COLOR_NEUTRO = '#cbd5e1'
const SEPARACION = 0.02
const BORDE = 0.003
const COLOR_BORDE = '#020617'

export interface Detalle {
  readonly texto: string
  readonly color: string
}

interface Props {
  readonly nodo: Nodo
  readonly posicion: Posicion
  readonly detalle: Detalle | null
}

export function Seleccion({ nodo, posicion, detalle }: Props) {
  const { x, y, z } = posicion
  return (
    <Billboard position={[x, y + DESPLAZAMIENTO_Y, z]}>
      <Text fontSize={TAMANO_TITULO} color={COLOR_TITULO} anchorY="bottom" maxWidth={ANCHO_MAXIMO}>
        {`${textoVisible(nodo.titulo, LARGO_SELECCION)} · ${nodo.estado}`}
      </Text>
      {detalle ? (
        <Text
          position={[0, -SEPARACION, 0]}
          fontSize={TAMANO_DETALLE}
          color={detalle.color}
          anchorY="top"
          maxWidth={ANCHO_MAXIMO}
          outlineWidth={BORDE}
          outlineColor={COLOR_BORDE}
        >
          {detalle.texto}
        </Text>
      ) : null}
    </Billboard>
  )
}

/** La selección con el bloqueo que calcula la API. */
export function SeleccionConBloqueo({ nodo, posicion }: Omit<Props, 'detalle'>) {
  const bloqueado = useDerivadoControllerBloqueado(nodo.id)
  const detalle: Detalle = bloqueado.isPending
    ? { texto: 'Preguntando a la API…', color: COLOR_NEUTRO }
    : bloqueado.isError
      ? { texto: 'No se pudo saber qué lo bloquea', color: COLOR_NEUTRO }
      : {
          texto: resumenDeEspera(bloqueado.data.por.map(({ titulo }) => titulo)),
          color: bloqueado.data.bloqueado ? COLOR_BLOQUEO : COLOR_LIBRE,
        }
  return <Seleccion nodo={nodo} posicion={posicion} detalle={detalle} />
}
