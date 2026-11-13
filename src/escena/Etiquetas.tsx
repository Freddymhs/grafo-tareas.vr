// Etiquetas solo en los nodos más cercanos a la cabeza (FASE 1, D3): un `<Text>` por nodo no escala ni se lee.
// Las HU siempre llevan la suya, más grande (FASE 13): son pocas y son las que orientan entre racimos.
// Con `todas` (FASE 15, el grafo real por defecto) cada nodo lleva la suya: es la prueba de que el acomodo se lee.
// Se recalcula unas pocas veces por segundo, no en cada frame, y solo re-renderiza si cambió el conjunto.

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import {
  ADELANTE_APUNTADA,
  ANCHO_ETIQUETA,
  ANCHO_ETIQUETA_APUNTADA,
  ANCHO_ETIQUETA_HU,
  BORDE_APUNTADA,
  DESPLAZAMIENTO_Y,
  TAMANO_TEXTO,
  TAMANO_TEXTO_APUNTADO,
  TAMANO_TEXTO_HU,
  medidasEtiqueta,
} from '../lib/constants/etiquetas'
import { conMarca, esDudaContestada } from '../lib/cierre'
import { conRotulo } from '../lib/directorio'
import { TipoNodo, type Nodo, type Posicion } from '../lib/dominio'
import { textoConFecha } from '../lib/paginas'
import { LARGO_APUNTADO, sinRonda, textoVisible } from '../lib/texto-visible'

export const ETIQUETAS_CERCANAS = 12
const SEGUNDOS_ENTRE_CALCULOS = 0.25
const COLOR_TEXTO = '#e2e8f0'
const COLOR_BORDE = '#020617'
const COLOR_TEXTO_APAGADO = '#334155'
/** Una duda contestada no se pierde con un filtro: el nodo se apaga, su nombre queda en verde suave (Freddy, 2026-10-19). */
const COLOR_TEXTO_CONTESTADA = '#6fbf8f'

interface Props {
  readonly nodos: readonly Nodo[]
  readonly posiciones: ReadonlyMap<string, Posicion>
  readonly excluir: string | null
  readonly todas: boolean
  /** El nodo bajo el rayo: su etiqueta va ampliada, con el título entero. */
  readonly apuntado: string | null
  /** Cuántas líneas lleva cada etiqueta en esta página (FASE 15): más donde hay espacio. */
  readonly lineas: number
  /** Lo iluminado —la familia de una selección (FASE 15) o lo pendiente del filtro (FASE 17)—: lo demás se apaga. */
  readonly iluminados: ReadonlySet<string> | null
  /** Las tareas sin padre: su etiqueta empieza con la fecha («14-oct · …», FASE 15). */
  readonly conFecha: ReadonlySet<string>
  /** Las piezas del plan con su número en la pelotita: su etiqueta va sin la tecla de la ronda (`sinRonda`). */
  readonly conNumero: ReadonlySet<string>
}

function mismosIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}

export function Etiquetas({
  nodos,
  posiciones,
  excluir,
  todas,
  apuntado,
  lineas,
  iluminados,
  conFecha,
  conNumero,
}: Props) {
  const { largo } = medidasEtiqueta(lineas)
  const [cercanos, setCercanos] = useState<readonly string[]>([])
  const ultimoCalculo = useRef(Number.NEGATIVE_INFINITY)

  useFrame(({ camera, clock }) => {
    if (todas || clock.elapsedTime - ultimoCalculo.current < SEGUNDOS_ENTRE_CALCULOS) return
    ultimoCalculo.current = clock.elapsedTime
    const { x: cx, y: cy, z: cz } = camera.position
    const porDistancia = nodos
      .filter(({ id }) => id !== excluir)
      .map(({ id }) => {
        const { x, y, z } = posiciones.get(id) ?? { x: 0, y: 0, z: 0 }
        return { id, distancia: Math.hypot(x - cx, y - cy, z - cz) }
      })
      .sort((a, b) => a.distancia - b.distancia)
    const nuevos = porDistancia.slice(0, ETIQUETAS_CERCANAS).map(({ id }) => id)
    setCercanos((actuales) => (mismosIds(actuales, nuevos) ? actuales : nuevos))
  })

  const porId = new Map(nodos.map((nodo) => [nodo.id, nodo]))
  const colorDeTexto = (id: string) => {
    const apagado = iluminados !== null && !iluminados.has(id)
    if (!apagado) return COLOR_TEXTO
    const nodo = porId.get(id)
    return nodo && esDudaContestada(nodo) ? COLOR_TEXTO_CONTESTADA : COLOR_TEXTO_APAGADO
  }
  const textoDe = (nodo: Nodo | undefined, id: string) => {
    if (!nodo) return id
    const titulo = conNumero.has(id) ? sinRonda(nodo.titulo) : nodo.titulo
    const texto = nodo.fecha && conFecha.has(id) ? textoConFecha(titulo, nodo.fecha) : titulo
    return conRotulo(conMarca(nodo, texto), nodo.fantasma)
  }
  const historias = nodos
    .filter(({ tipo, id }) => tipo === TipoNodo.HISTORIA && id !== excluir)
    .map(({ id }) => id)
  const normales = todas
    ? nodos.filter(({ id }) => id !== excluir).map(({ id }) => id)
    : [...new Set([...historias, ...cercanos])]
  const visibles = normales.filter((id) => id !== apuntado)
  const nodoApuntado = apuntado && apuntado !== excluir ? porId.get(apuntado) : undefined
  const enApuntado = apuntado ? posiciones.get(apuntado) : undefined
  return (
    <>
      {visibles.map((id) => {
        const { x, y, z } = posiciones.get(id) ?? { x: 0, y: 0, z: 0 }
        return (
          <Billboard key={id} position={[x, y + DESPLAZAMIENTO_Y, z]}>
            <Text
              fontSize={porId.get(id)?.tipo === TipoNodo.HISTORIA ? TAMANO_TEXTO_HU : TAMANO_TEXTO}
              color={colorDeTexto(id)}
              anchorY="bottom"
              maxWidth={
                porId.get(id)?.tipo === TipoNodo.HISTORIA ? ANCHO_ETIQUETA_HU : ANCHO_ETIQUETA
              }
              textAlign="center"
            >
              {textoVisible(textoDe(porId.get(id), id), largo)}
            </Text>
          </Billboard>
        )
      })}
      {nodoApuntado && enApuntado ? (
        <Billboard
          position={[
            enApuntado.x * ADELANTE_APUNTADA,
            enApuntado.y + DESPLAZAMIENTO_Y,
            enApuntado.z * ADELANTE_APUNTADA,
          ]}
        >
          <Text
            fontSize={TAMANO_TEXTO_APUNTADO}
            color={COLOR_TEXTO}
            anchorY="bottom"
            maxWidth={ANCHO_ETIQUETA_APUNTADA}
            textAlign="center"
            outlineWidth={BORDE_APUNTADA}
            outlineColor={COLOR_BORDE}
          >
            {textoVisible(textoDe(nodoApuntado, nodoApuntado.id), LARGO_APUNTADO)}
          </Text>
        </Billboard>
      ) : null}
    </>
  )
}
