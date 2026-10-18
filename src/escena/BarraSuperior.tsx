// La fila de arriba (FASE 15): las páginas —una por HU, con sus tareas abiertas— y qué significa cada color. Mínima: una
// línea de pestañas y una de leyenda, fija al frente sobre la pantalla curva. La pestaña se toca con el rayo; X / Y del
// control izquierdo hacen lo mismo sin apuntar (`CambioDePagina`). Las páginas las arma la API; acá solo se muestran.
import { Text } from '@react-three/drei'
import { useDerivadoControllerPaginas } from '../lib/api/generado/derivado/derivado'
import {
  COLOR_DUDA,
  COLOR_FASE,
  COLOR_HISTORIA,
  COLOR_PERSONA,
  COLOR_SIN_RAMA,
} from '../lib/constants/grafo'
import type { Nodo } from '../lib/dominio'
import { useEstadoVr } from '../lib/estado-vr'
import { ALTO_MEDIO, ALTURA_OJOS, RADIO_PANORAMA } from '../lib/layout'
import { textoVisible } from '../lib/texto-visible'
import { ALTO_BOTON, ANCHO_BOTON, Boton3D } from './Boton3D'

/** Delante de la pantalla (no la atraviesa) y justo encima de su banda. */
const DISTANCIA = RADIO_PANORAMA - 0.5
const ALTURA = ALTURA_OJOS + ALTO_MEDIO + 0.1
const SEPARACION_PESTANAS = 0.03
const BAJO_LAS_PESTANAS = ALTO_BOTON + 0.035
const TAMANO_LEYENDA = 0.026
/** Ancho aproximado de una letra de la leyenda: alcanza para repartir los ítems sin medir el texto. */
const ANCHO_LETRA = TAMANO_LEYENDA * 0.55
const RADIO_PUNTO = 0.016
const ESCALA_CERRADA = 0.5
const AIRE_ITEM = 0.05
const LARGO_RAMA = 22
const COLOR_TEXTO = '#cbd5e1'

interface Item {
  readonly color: string | null
  readonly texto: string
  readonly escala?: number
}

const FIJOS: readonly Item[] = [
  { color: COLOR_HISTORIA, texto: 'HU' },
  { color: COLOR_FASE, texto: 'FASE' },
  { color: COLOR_DUDA, texto: 'duda' },
  { color: COLOR_PERSONA, texto: 'persona' },
  { color: COLOR_SIN_RAMA, texto: 'sin rama' },
]
const CERRADA: Item = { color: COLOR_SIN_RAMA, texto: 'chica = cerrada', escala: ESCALA_CERRADA }

/** Solo las ramas con nombre (los carriles del Draft): los círculos sin nombre (solo emoji) no explican nada. */
function itemsDeRamas(ramas: readonly Nodo[]): readonly Item[] {
  return ramas
    .map(({ color, titulo }) => ({
      color: color ?? COLOR_SIN_RAMA,
      texto: textoVisible(titulo, LARGO_RAMA),
    }))
    .filter(({ texto }) => texto !== '')
}

/** Entre lo que significa cada tipo de pelota y los colores de las ramas. */
const SEPARADOR: Item = { color: null, texto: '│' }

const anchoDe = ({ color, texto }: Item) =>
  (color ? 2 * RADIO_PUNTO + 0.01 : 0) + texto.length * ANCHO_LETRA + AIRE_ITEM

function Leyenda({ items }: { readonly items: readonly Item[] }) {
  const anchos = items.map(anchoDe)
  const total = anchos.reduce((suma, ancho) => suma + ancho, 0)
  const inicios = anchos.map((_, i) => -total / 2 + anchos.slice(0, i).reduce((s, a) => s + a, 0))
  return (
    <>
      {items.map((item, i) => (
        <group key={`${item.texto}-${item.color ?? ''}-${i}`} position={[inicios[i], 0, 0]}>
          {item.color ? (
            <mesh position={[RADIO_PUNTO, 0, 0]} scale={item.escala ?? 1}>
              <sphereGeometry args={[RADIO_PUNTO, 12, 12]} />
              <meshStandardMaterial color={item.color} />
            </mesh>
          ) : null}
          <Text
            position={[item.color ? 2 * RADIO_PUNTO + 0.01 : 0, 0, 0]}
            fontSize={TAMANO_LEYENDA}
            color={COLOR_TEXTO}
            anchorX="left"
            anchorY="middle"
          >
            {item.texto}
          </Text>
        </group>
      ))}
    </>
  )
}

/** «HU 19565 · Registrar Toma…» → «HU 19565»: la pestaña lleva el número; el nombre entero, la esfera de la HU. */
const corto = (titulo: string) => titulo.split(' · ')[0] ?? titulo

interface Props {
  readonly ramas: readonly Nodo[]
  readonly indice: number
}

export function BarraSuperior({ ramas, indice }: Props) {
  const paginas = useDerivadoControllerPaginas().data ?? []
  const irAPagina = useEstadoVr((estado) => estado.irAPagina)
  const anchoPestanas = paginas.length * (ANCHO_BOTON + SEPARACION_PESTANAS) - SEPARACION_PESTANAS
  return (
    <group position={[0, ALTURA, -DISTANCIA]}>
      {paginas.map(({ id, titulo, abiertas }, i) => (
        <Boton3D
          key={id}
          texto={`${corto(titulo)} · ${abiertas}`}
          posicion={[
            -anchoPestanas / 2 + ANCHO_BOTON / 2 + i * (ANCHO_BOTON + SEPARACION_PESTANAS),
            0,
            0,
          ]}
          onTocar={() => irAPagina(i)}
          resaltado={i === indice}
        />
      ))}
      <group position={[0, -BAJO_LAS_PESTANAS, 0]}>
        <Leyenda items={[...FIJOS, CERRADA, SEPARADOR, ...itemsDeRamas(ramas)]} />
      </group>
    </group>
  )
}
