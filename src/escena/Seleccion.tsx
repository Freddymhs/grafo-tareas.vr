// El nodo seleccionado: su título y qué lo bloquea. El "qué lo bloquea" lo responde la API
// (`GET /nodos/:id/bloqueado`, decisión C1); en el sintético de la FASE 1 no hay API y no se muestra.

import { Billboard, Text } from '@react-three/drei'
import { useDerivadoControllerBloqueado } from '../lib/api/generado/derivado/derivado'
import type { Nodo, Posicion } from '../lib/dominio'
import { LARGO_ETIQUETA, LARGO_SELECCION, textoVisible } from '../lib/texto-visible'

const TAMANO_TITULO = 0.06
const TAMANO_DETALLE = 0.04
const DESPLAZAMIENTO_Y = 0.16
const ANCHO_MAXIMO = 1.2
const COLOR_TITULO = '#ffffff'
const COLOR_BLOQUEO = '#fca5a5'
const COLOR_LIBRE = '#86efac'
const COLOR_NEUTRO = '#cbd5e1'
const SEPARACION = 0.02

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
      : bloqueado.data.bloqueado
        ? {
            texto: `Bloqueado por: ${bloqueado.data.por
              .map(({ titulo }) => textoVisible(titulo, LARGO_ETIQUETA))
              .join(' · ')}`,
            color: COLOR_BLOQUEO,
          }
        : { texto: 'Libre: nada lo bloquea', color: COLOR_LIBRE }
  return <Seleccion nodo={nodo} posicion={posicion} detalle={detalle} />
}
