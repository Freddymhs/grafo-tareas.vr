// La fila de arriba (FASE 15): las páginas —una por HU, con sus tareas abiertas— y qué significa cada color. Mínima: una
// línea de pestañas y una de leyenda, fija al frente sobre la pantalla curva. La pestaña se toca con el rayo; X / Y del
// control izquierdo hacen lo mismo sin apuntar (`CambioDePagina`). Las páginas las arma la API; acá solo se muestran.
// La HU que tiene plan (FASE 17) lleva la esquina de su pestaña doblada: la hoja tiene otra cara. Vista por el plan, la
// pestaña se pone ámbar y dice «plan N»; tocar la pestaña de la HU que se ve da vuelta la hoja.
import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { Shape } from 'three'
import { useDerivadoControllerPaginas } from '../lib/api/generado/derivado/derivado'
import {
  COLOR_BORDE_SIN_TASK,
  COLOR_DUDA,
  COLOR_FASE,
  COLOR_HISTORIA,
  COLOR_PARA_DECIR,
  COLOR_PBI_A_MEDIAS,
  COLOR_PERSONA,
  COLOR_SIN_RAMA,
} from '../lib/constants/grafo'
import { type ConteoDeDudas, textoDeDudas } from '../lib/cierre'
import { textoDePiezas } from '../lib/piezas'
import { Cara, type Nodo } from '../lib/dominio'
import { useEstadoVr } from '../lib/estado-vr'
import { type Filtro, TEXTO_DEL_FILTRO } from '../lib/filtro'
import { librosDe } from '../lib/paginas'
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
/** La cara plan (FASE 17): ámbar, el color del reverso de la hoja. */
const COLOR_PLAN = '#b45309'
const COLOR_ESQUINA = '#f59e0b'
const LADO_ESQUINA = 0.024
/** La esquina doblada, arriba a la derecha de la pestaña: un triángulo con el ángulo recto en la esquina. */
const ESQUINA = new Shape()
  .moveTo(0, 0)
  .lineTo(-LADO_ESQUINA, 0)
  .lineTo(0, -LADO_ESQUINA)
  .closePath()
const DELANTE_DE_LA_PESTANA = 0.002

interface Item {
  readonly color: string | null
  readonly texto: string
  readonly escala?: number
}

const FIJOS: readonly Item[] = [
  { color: COLOR_HISTORIA, texto: 'HU' },
  { color: COLOR_FASE, texto: 'PBI' },
  { color: COLOR_PBI_A_MEDIAS, texto: 'PBI a medias' },
  { color: COLOR_BORDE_SIN_TASK, texto: 'borde = sin task en Azure' },
  { color: COLOR_DUDA, texto: 'duda' },
  { color: COLOR_PERSONA, texto: 'persona' },
  { color: COLOR_PARA_DECIR, texto: 'para decir' },
  { color: COLOR_SIN_RAMA, texto: 'sin rama' },
]
const CERRADA: Item = { color: COLOR_SIN_RAMA, texto: 'chica = cerrada', escala: ESCALA_CERRADA }
/** Mientras un filtro está puesto (FASE 17): qué se está viendo y con qué dedos se sale. */
const itemDelFiltro = (filtro: Filtro): readonly Item[] => {
  const texto = TEXTO_DEL_FILTRO[filtro]
  return texto ? [{ color: null, texto }, SEPARADOR] : []
}

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
  readonly cara: Cara
  /** A qué cara lleva dar vuelta la hoja (`null`: la HU no tiene plan). */
  readonly otra: Cara | null
  /** Las dudas de la cara que se ve: cuántas quedan y cuántas se contestaron (el avance, Freddy 2026-10-19). */
  readonly dudas: ConteoDeDudas
  /** Las piezas de la cara que todavía no tienen task: en el plan se dicen, para no leerlas como una fase. */
  readonly piezasSinTask: number
}

/** El avance en dudas va primero en la leyenda, en el color de las dudas. */
const itemDeDudas = (dudas: ConteoDeDudas): readonly Item[] => {
  const texto = textoDeDudas(dudas)
  return texto ? [{ color: COLOR_DUDA, texto }, SEPARADOR] : []
}

/** Solo en la cara plan: ahí las piezas son lo que falta crear; en lo real ya tienen su task. */
const itemDePiezas = (cara: Cara, piezasSinTask: number): readonly Item[] => {
  const texto = cara === Cara.PLAN ? textoDePiezas(piezasSinTask) : null
  return texto ? [{ color: null, texto }, SEPARADOR] : []
}

export function BarraSuperior({ ramas, indice, cara, otra, dudas, piezasSinTask }: Props) {
  const paginas = useDerivadoControllerPaginas().data
  const libros = useMemo(() => librosDe(paginas ?? []), [paginas])
  const irALibro = useEstadoVr((estado) => estado.irALibro)
  const verCara = useEstadoVr((estado) => estado.verCara)
  const filtro = useEstadoVr((estado) => estado.filtro)
  const anchoPestanas = libros.length * (ANCHO_BOTON + SEPARACION_PESTANAS) - SEPARACION_PESTANAS
  const x = (lugar: number) =>
    -anchoPestanas / 2 + ANCHO_BOTON / 2 + lugar * (ANCHO_BOTON + SEPARACION_PESTANAS)
  return (
    <group position={[0, ALTURA, -DISTANCIA]}>
      {libros.map(({ id, real, plan }, i) => {
        const portada = real ?? plan
        if (!portada) return null
        const activa = i === indice
        const enPlan = activa && cara === Cara.PLAN && plan !== null
        const texto = enPlan
          ? `${corto(portada.titulo)} · plan ${plan.abiertas}`
          : `${corto(portada.titulo)} · ${portada.abiertas}`
        // La pestaña de la HU que se ve da vuelta la hoja; otra pestaña abre esa HU por lo real.
        const tocar = () => (activa && otra ? verCara(otra) : irALibro(i))
        return (
          <group key={id}>
            <Boton3D
              texto={texto}
              posicion={[x(i), 0, 0]}
              onTocar={tocar}
              resaltado={activa}
              colorResaltado={enPlan ? COLOR_PLAN : undefined}
            />
            {plan ? (
              <mesh position={[x(i) + ANCHO_BOTON / 2, ALTO_BOTON / 2, DELANTE_DE_LA_PESTANA]}>
                <shapeGeometry args={[ESQUINA]} />
                <meshBasicMaterial color={COLOR_ESQUINA} />
              </mesh>
            ) : null}
          </group>
        )
      })}
      <group position={[0, -BAJO_LAS_PESTANAS, 0]}>
        <Leyenda
          items={[
            ...itemDelFiltro(filtro),
            ...itemDeDudas(dudas),
            ...itemDePiezas(cara, piezasSinTask),
            ...FIJOS,
            CERRADA,
            SEPARADOR,
            ...itemsDeRamas(ramas),
          ]}
        />
      </group>
    </group>
  )
}
