// El borde de lo que no está en Azure (`lib/borde.ts`): un anillo delgado alrededor de la esfera, siempre de frente al
// visor. Son pocos (las FASE sin task), así que van como mallas sueltas y no en las `<Instances>` de las esferas.
import { Billboard } from '@react-three/drei'
import { DoubleSide } from 'three'
import { COLOR_BORDE_SIN_TASK, RADIO_NODO } from '../lib/constants/grafo'
import type { Nodo, Posicion } from '../lib/dominio'
import { escalaDe } from '../lib/escala-nodo'

/** Del borde de la esfera hacia afuera, en radios de esa esfera: un aro delgado que no la tapa. */
const DESDE = 1.15
const HASTA = 1.3
const SEGMENTOS_ANILLO = 32
/** El anillo no toma el rayo: el toque sigue llegando a la esfera de abajo. */
const SIN_RAYO = () => null

interface Props {
  readonly nodos: readonly Nodo[]
  readonly ids: ReadonlySet<string>
  readonly posiciones: ReadonlyMap<string, Posicion>
  readonly seleccionado: string | null
  readonly resaltados: ReadonlySet<string>
}

export function Bordes({ nodos, ids, posiciones, seleccionado, resaltados }: Props) {
  const conBorde = nodos.filter(({ id }) => ids.has(id))
  return (
    <>
      {conBorde.map((nodo) => {
        const posicion = posiciones.get(nodo.id)
        if (!posicion) return null
        const radio = RADIO_NODO * escalaDe(nodo, seleccionado, resaltados)
        return (
          <Billboard key={nodo.id} position={[posicion.x, posicion.y, posicion.z]}>
            <mesh raycast={SIN_RAYO}>
              <ringGeometry args={[radio * DESDE, radio * HASTA, SEGMENTOS_ANILLO]} />
              <meshBasicMaterial color={COLOR_BORDE_SIN_TASK} side={DoubleSide} />
            </mesh>
          </Billboard>
        )
      })}
    </>
  )
}
