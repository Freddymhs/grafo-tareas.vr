// El nodo seleccionado: su título, de qué trata (su resumen, con las palabras del humano) y qué lo bloquea —a una persona, quién la espera; a un PBI a medias, qué mitad le
// falta; a algo cerrado, cuándo y con qué respuesta se cerró—. El "qué lo bloquea" lo responde la API
// (`GET /nodos/:id/bloqueado`, decisión C1); en el sintético de la FASE 1 no hay API y no se muestra.

import { Billboard, Text } from '@react-three/drei'
import { useDerivadoControllerBloqueado } from '../lib/api/generado/derivado/derivado'
import { usePulidoControllerCambiosDe } from '../lib/api/generado/pulido/pulido'
import { conMarca, resumenDeCierre } from '../lib/cierre'
import { altoDeTexto } from '../lib/constants/etiquetas'
import type { Nodo, Posicion } from '../lib/dominio'
import { avisoDePbi, resumenDeEspera, resumenDeQuienEspera } from '../lib/seleccion'
import { LARGO_SELECCION, textoVisible } from '../lib/texto-visible'

const TAMANO_TITULO = 0.06
const TAMANO_DETALLE = 0.04
/** Lo que se lee en voz alta en la reunión: un poco más grande que el detalle, y en celeste para distinguirlo. */
const TAMANO_RESUMEN = 0.045
const COLOR_RESUMEN = '#7dd3fc'
const DESPLAZAMIENTO_Y = 0.16
/**
 * Hacia la cabeza, delante de la esfera seleccionada (la más grande: RADIO_NODO × 2,2 = 0,11): el texto que baja
 * —resumen, bloqueo— quedaba detrás de la pelota y no se leía (Freddy, 2026-10-26).
 */
const DELANTE_DE_LA_ESFERA = 0.15
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
  const { resumen } = nodo
  const bajoElResumen = resumen
    ? altoDeTexto(resumen, TAMANO_RESUMEN, ANCHO_MAXIMO) + SEPARACION
    : 0
  return (
    <Billboard position={[x, y + DESPLAZAMIENTO_Y, z]}>
      <group position={[0, 0, DELANTE_DE_LA_ESFERA]}>
        <Text
          fontSize={TAMANO_TITULO}
          color={COLOR_TITULO}
          anchorY="bottom"
          maxWidth={ANCHO_MAXIMO}
        >
          {`${conMarca(nodo, textoVisible(nodo.titulo, LARGO_SELECCION))} · ${nodo.estado}`}
        </Text>
        {resumen ? (
          <Text
            position={[0, -SEPARACION, 0]}
            fontSize={TAMANO_RESUMEN}
            color={COLOR_RESUMEN}
            anchorY="top"
            maxWidth={ANCHO_MAXIMO}
            outlineWidth={BORDE}
            outlineColor={COLOR_BORDE}
          >
            {resumen}
          </Text>
        ) : null}
        {detalle ? (
          <Text
            position={[0, -SEPARACION - bajoElResumen, 0]}
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
      </group>
    </Billboard>
  )
}

/** La selección con el bloqueo que calcula la API; a un PBI a medias, además, qué mitad le falta (en ámbar). */
export function SeleccionConBloqueo({ nodo, posicion }: Omit<Props, 'detalle'>) {
  const bloqueado = useDerivadoControllerBloqueado(nodo.id)
  const espera: Detalle = bloqueado.isPending
    ? { texto: 'Preguntando a la API…', color: COLOR_NEUTRO }
    : bloqueado.isError
      ? { texto: 'No se pudo saber qué lo bloquea', color: COLOR_NEUTRO }
      : {
          texto: resumenDeEspera(bloqueado.data.por.map(({ titulo }) => titulo)),
          color: bloqueado.data.bloqueado ? COLOR_BLOQUEO : COLOR_LIBRE,
        }
  const aviso = avisoDePbi(nodo)
  const detalle = aviso ? { texto: `${aviso}\n${espera.texto}`, color: COLOR_BLOQUEO } : espera
  return <Seleccion nodo={nodo} posicion={posicion} detalle={detalle} />
}

/** Lo cerrado ya no espera nada: dice cuándo se cerró y con qué motivo (la respuesta, si es una duda). */
export function SeleccionDeCerrado({ nodo, posicion }: Omit<Props, 'detalle'>) {
  const bitacora = usePulidoControllerCambiosDe(nodo.id)
  const detalle: Detalle = bitacora.isPending
    ? { texto: 'Preguntando a la API…', color: COLOR_NEUTRO }
    : bitacora.isError
      ? { texto: 'No se pudo leer cómo se cerró', color: COLOR_NEUTRO }
      : { texto: resumenDeCierre(nodo, bitacora.data), color: COLOR_LIBRE }
  return <Seleccion nodo={nodo} posicion={posicion} detalle={detalle} />
}

/** Una persona no espera nada: la esperan. Lo que la espera está en la página (`quienesEsperan`), sin preguntar a la API. */
export function SeleccionDePersona({
  nodo,
  posicion,
  esperan,
}: Omit<Props, 'detalle'> & { readonly esperan: readonly string[] }) {
  const detalle: Detalle = {
    texto: resumenDeQuienEspera(esperan),
    color: esperan.length > 0 ? COLOR_BLOQUEO : COLOR_LIBRE,
  }
  return <Seleccion nodo={nodo} posicion={posicion} detalle={detalle} />
}
