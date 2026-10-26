// La cara plan (Freddy, 2026-10-26): dentro de la pelotita de cada pieza, su número en el carril; al lado, una pelotita
// chica del color de cada OTRO carril que espera, con el número de la tarjeta que espera ahí («espera al 1 verde»: la
// pelotita sola decía la línea pero no la tarjeta, y confundía). Todo lo calcula la API (`lib/plan.ts`); acá se dibuja
// de frente a la cabeza, delante de cada esfera, con el texto que más contrasta con su color.
import { Billboard, Text } from '@react-three/drei'
import { colorDeTextoSobre } from '../lib/colores'
import { COLOR_SIN_RAMA, RADIO_NODO } from '../lib/constants/grafo'
import type { Nodo, Posicion } from '../lib/dominio'
import { escalaDe } from '../lib/escala-nodo'
import type { MarcaDelPlan } from '../lib/plan'

/** El número ocupa casi toda la esfera: se lee de lejos. */
const TAMANO_NUMERO = 1.3
/** Delante de la superficie, para que la esfera no lo tape. */
const DELANTE = 0.005
/** La pelotita de lo que espera, chica al lado de la de la pieza, con lugar para su número. */
const RADIO_ESPERA = RADIO_NODO * 0.55
/** Van arriba a la derecha de la esfera, en fila: a esta altura (en radios de la esfera) y con aire entre ellas. */
const ALTURA_ESPERAS = 0.7
const SEPARACION_ESPERAS = RADIO_ESPERA * 2.4
const SEGMENTOS = 10

interface Props {
  readonly nodos: readonly Nodo[]
  readonly posiciones: ReadonlyMap<string, Posicion>
  readonly marcas: ReadonlyMap<string, MarcaDelPlan>
  /** Los colores que se ven (apagados con un filtro o una selección): el número contrasta con ése. */
  readonly colores: ReadonlyMap<string, string>
  readonly seleccionado: string | null
  readonly resaltados: ReadonlySet<string>
}

export function MarcasDelPlan({
  nodos,
  posiciones,
  marcas,
  colores,
  seleccionado,
  resaltados,
}: Props) {
  return nodos.map((nodo) => {
    const marca = marcas.get(nodo.id)
    const posicion = posiciones.get(nodo.id)
    if (!marca || !posicion) return null
    const radio = RADIO_NODO * escalaDe(nodo, seleccionado, resaltados)
    const fondo = colores.get(nodo.id) ?? COLOR_SIN_RAMA
    return (
      <Billboard key={nodo.id} position={[posicion.x, posicion.y, posicion.z]}>
        <Text
          position={[0, 0, radio + DELANTE]}
          fontSize={radio * TAMANO_NUMERO}
          color={colorDeTextoSobre(fondo)}
          anchorX="center"
          anchorY="middle"
        >
          {String(marca.orden)}
        </Text>
        {marca.esperas.map(({ color, numero }, indice) => (
          <group
            key={color}
            position={[
              radio + RADIO_ESPERA + indice * SEPARACION_ESPERAS,
              radio * ALTURA_ESPERAS,
              0,
            ]}
          >
            <mesh>
              <sphereGeometry args={[RADIO_ESPERA, SEGMENTOS, SEGMENTOS]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <Text
              position={[0, 0, RADIO_ESPERA + DELANTE]}
              fontSize={RADIO_ESPERA * TAMANO_NUMERO}
              color={colorDeTextoSobre(color)}
              anchorX="center"
              anchorY="middle"
            >
              {String(numero)}
            </Text>
          </group>
        ))}
      </Billboard>
    )
  })
}
