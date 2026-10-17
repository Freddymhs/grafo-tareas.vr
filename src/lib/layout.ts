// La pantalla curva (FASE 15, pedido de Freddy en el visor): el grafo rodea al usuario como una pantalla de 360° a
// la altura de los ojos, todo a la misma distancia, sin subir ni bajar. Lo conectado va delante y a los lados (un
// layout de fuerzas en 2D, enrollado en el cilindro); lo que no tiene ninguna conexión va junto, en una grilla detrás:
// en un layout de fuerzas lo suelto sale despedido al borde y, como el más lejano fija la escala, encoge a todo lo
// demás. Es solo geometría de presentación; se calcula UNA vez fuera del render (FASE 1, D4) y se persiste (C2).
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type NodoSimulacion,
} from 'd3-force-3d'
import type { Grafo, Nodo, Posicion } from './dominio'

const DIMENSIONES = 2
export const TICKS_LAYOUT = 300
const DISTANCIA_ENLACE = 30
const CARGA = -40
export const ALTURA_OJOS = 1.6
/** Distancia (m) de la pantalla al usuario. Se calibra con `?radio=` (FASE 15). */
export const RADIO_PANORAMA = 3
/** Media altura (m) de la banda: de ALTURA_OJOS − ALTO_MEDIO a ALTURA_OJOS + ALTO_MEDIO. */
export const ALTO_MEDIO = 1
const GRADO = Math.PI / 180
/** Hueco entre lo conectado y las sueltas, a cada lado, para que se vean como dos zonas. */
const HUECO = 10 * GRADO
const ARCO_SUELTAS_MINIMO = 30 * GRADO
const ARCO_SUELTAS_MAXIMO = 120 * GRADO

/** Un punto de la pantalla: `angulo` 0 es el frente (−z), positivo hacia la derecha. */
export function enCilindro(angulo: number, altura: number, radio: number): Posicion {
  return { x: radio * Math.sin(angulo), y: altura, z: -radio * Math.cos(angulo) }
}

/** El ángulo de un punto en la pantalla, en (−π, π]: 0 al frente, ±π detrás. */
export function anguloDe({ x, z }: Posicion): number {
  return Math.atan2(x, -z)
}

/** Lleva [min, max] a [desde, hasta]; un rango vacío cae en el medio. */
function escalar(valor: number, min: number, max: number, desde: number, hasta: number): number {
  const ancho = max - min
  return ancho === 0 ? (desde + hasta) / 2 : desde + ((valor - min) / ancho) * (hasta - desde)
}

function conConexion(grafo: Grafo): ReadonlySet<string> {
  return new Set(grafo.conexiones.flatMap(({ origenId, destinoId }) => [origenId, destinoId]))
}

/** Lo conectado, con fuerzas en 2D, enrollado en `arco` centrado al frente. */
function ubicarConectadas(
  grafo: Grafo,
  ids: ReadonlySet<string>,
  arco: number,
  radio: number,
  ticks: number,
): ReadonlyArray<readonly [string, Posicion]> {
  // d3 escribe x/y en estos objetos: son copias que nacen y mueren acá, el grafo de entrada no se toca.
  const nodosSimulacion: NodoSimulacion[] = [...ids].map((id) => ({ id }))
  const enlaces = grafo.conexiones.map(({ origenId, destinoId }) => ({
    source: origenId,
    target: destinoId,
  }))
  forceSimulation(nodosSimulacion, DIMENSIONES)
    .force(
      'enlace',
      forceLink(enlaces)
        .id(({ id }) => id)
        .distance(DISTANCIA_ENLACE),
    )
    .force('carga', forceManyBody().strength(CARGA))
    .force('centro', forceCenter(0, 0))
    .stop()
    .tick(ticks)
  const xs = nodosSimulacion.map(({ x = 0 }) => x)
  const ys = nodosSimulacion.map(({ y = 0 }) => y)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  return nodosSimulacion.map(({ id, x = 0, y = 0 }) => {
    const angulo = escalar(x, xMin, xMax, -arco / 2, arco / 2)
    // En d3 la y crece hacia abajo (como en una pantalla); en three, hacia arriba.
    const altura = escalar(y, yMin, yMax, ALTURA_OJOS + ALTO_MEDIO, ALTURA_OJOS - ALTO_MEDIO)
    return [id, enCilindro(angulo, altura, radio)] as const
  })
}

/** Las sueltas en una grilla detrás, ordenadas por título: se leen como una lista. */
function ubicarSueltas(
  sueltas: readonly Nodo[],
  arco: number,
  radio: number,
): ReadonlyArray<readonly [string, Posicion]> {
  const anchoArco = arco * radio
  const columnas = Math.max(
    1,
    Math.round(Math.sqrt((sueltas.length * anchoArco) / (2 * ALTO_MEDIO))),
  )
  const filas = Math.ceil(sueltas.length / columnas)
  const ordenadas = sueltas.toSorted(
    (a, b) => a.titulo.localeCompare(b.titulo) || a.id.localeCompare(b.id),
  )
  return ordenadas.map(({ id }, i) => {
    const columna = i % columnas
    const fila = Math.floor(i / columnas)
    const angulo = Math.PI - arco / 2 + (arco * (columna + 0.5)) / columnas
    const altura = ALTURA_OJOS + ALTO_MEDIO - (2 * ALTO_MEDIO * (fila + 0.5)) / filas
    return [id, enCilindro(angulo, altura, radio)] as const
  })
}

/** Cuánto del círculo ocupan las sueltas: su proporción, acotada (ni un hilo ni media pantalla). */
function arcoDeSueltas(sueltas: number, total: number): number {
  if (sueltas === 0) return 0
  if (sueltas === total) return 2 * Math.PI - HUECO
  const proporcional = (2 * Math.PI * sueltas) / total
  return Math.min(ARCO_SUELTAS_MAXIMO, Math.max(ARCO_SUELTAS_MINIMO, proporcional))
}

export function calcularLayout(
  grafo: Grafo,
  radio: number = RADIO_PANORAMA,
  ticks: number = TICKS_LAYOUT,
): ReadonlyMap<string, Posicion> {
  const conectadas = conConexion(grafo)
  const sueltas = grafo.nodos.filter(({ id }) => !conectadas.has(id))
  const arcoSueltas = arcoDeSueltas(sueltas.length, grafo.nodos.length)
  const huecos = sueltas.length > 0 ? 2 * HUECO : HUECO
  const arcoConectadas = 2 * Math.PI - arcoSueltas - huecos
  const ubicadas =
    conectadas.size > 0 ? ubicarConectadas(grafo, conectadas, arcoConectadas, radio, ticks) : []
  return new Map([...ubicadas, ...ubicarSueltas(sueltas, arcoSueltas, radio)])
}
