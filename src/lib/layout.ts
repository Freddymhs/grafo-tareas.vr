// La pantalla curva (FASE 15, pedido de Freddy en el visor): el grafo rodea al usuario como una pantalla de 360° a
// la altura de los ojos, todo a la misma distancia, sin subir ni bajar. Lo conectado va delante y a los lados; lo que
// no tiene ninguna conexión va junto, en una grilla detrás. El acomodo se calcula en metros de la pantalla desenrollada
// y reserva para cada nodo la celda de su etiqueta (`CELDA`): las fuerzas acercan lo relacionado y el choque impide
// que un texto pise a otro («así es imposible de leer», 2026-10-17). La pertenencia a una rama tira poco: el color ya
// la dice, y con fuerza normal cada rama (≈80 tarjetas) amontonaba todo en un punto. Es solo geometría de presentación;
// se calcula UNA vez fuera del render (FASE 1, D4) y se persiste (C2).
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type FuerzaPropia,
  type NodoSimulacion,
} from 'd3-force-3d'
import {
  CELDA,
  CELDA_HU,
  LINEAS_MAXIMAS,
  LINEAS_MINIMAS,
  medidasEtiqueta,
  type Medidas,
} from './constants/etiquetas'
import { TipoConexion, TipoNodo, type Grafo, type Nodo, type Posicion } from './dominio'
import { hashUnitario } from './hash'

const DIMENSIONES = 2
export const TICKS_LAYOUT = 400
/** Lo que una rama tira de sus tarjetas, frente a ~1 de un enlace normal. */
const FUERZA_RAMA = 0.02
/** Repulsión suave y de corto alcance: separa los grupos sin dispersarlos. */
const CARGA = -0.05
const ALCANCE_CARGA = 2
const VUELTAS_CHOQUE = 3
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
export const VUELTA = 2 * Math.PI
/** Una página (una HU) usa la media pantalla de adelante; si no le alcanza, se ensancha hasta tres cuartos. */
const ABERTURA_PAGINA_MINIMA = Math.PI
const ABERTURA_PAGINA_MAXIMA = 1.5 * Math.PI
/** Qué parte de la pantalla ocupan las celdas: el resto es el aire que deja leer. */
const LLENADO = 0.6

/** Un punto de la pantalla: `angulo` 0 es el frente (−z), positivo hacia la derecha. */
export function enCilindro(angulo: number, altura: number, radio: number): Posicion {
  return { x: radio * Math.sin(angulo), y: altura, z: -radio * Math.cos(angulo) }
}

/** El ángulo de un punto en la pantalla, en (−π, π]: 0 al frente, ±π detrás. */
export function anguloDe({ x, z }: Posicion): number {
  return Math.atan2(x, -z)
}

function conConexion(grafo: Grafo): ReadonlySet<string> {
  return new Set(grafo.conexiones.flatMap(({ origenId, destinoId }) => [origenId, destinoId]))
}

const radioDeCelda = (tipo: TipoNodo | undefined, celda: Medidas) =>
  (tipo === TipoNodo.HISTORIA ? CELDA_HU.ancho : celda.ancho) / 2

/**
 * Lo conectado, enrollado en `arco` centrado en el ángulo `centro`. La simulación corre en la pantalla desenrollada: `x` en metros
 * a lo largo del arco y `y` en metros de altura × ASPECTO, para que la celda (ancha y baja) sea un círculo.
 */
function ubicarConectadas(
  grafo: Grafo,
  ids: ReadonlySet<string>,
  arco: number,
  radio: number,
  ticks: number,
  centro: number,
  celda: Medidas,
): ReadonlyArray<readonly [string, Posicion]> {
  // Las celdas son anchas y bajas: la altura se estira por este factor y el choque se calcula con círculos.
  const aspecto = celda.ancho / celda.alto
  const tipoDe = new Map(grafo.nodos.map(({ id, tipo }) => [id, tipo]))
  const grado = new Map<string, number>()
  grafo.conexiones.forEach(({ origenId, destinoId }) => {
    grado.set(origenId, (grado.get(origenId) ?? 0) + 1)
    grado.set(destinoId, (grado.get(destinoId) ?? 0) + 1)
  })
  const mitadAncho = (arco * radio) / 2
  const mitadAlto = ALTO_MEDIO * aspecto
  // d3 escribe x/y en estos objetos: son copias que nacen y mueren acá, el grafo de entrada no se toca. Arrancan
  // repartidas por toda la pantalla (fijo por id), no apiladas en el centro.
  const nodosSimulacion: NodoSimulacion[] = [...ids].map((id) => ({
    id,
    x: (2 * hashUnitario(id, 'u') - 1) * mitadAncho * 0.9,
    y: (2 * hashUnitario(id, 'v') - 1) * mitadAlto * 0.9,
  }))
  const enlaces = grafo.conexiones.map(({ origenId, destinoId, tipo }) => ({
    source: origenId,
    target: destinoId,
    fuerza:
      tipo === TipoConexion.PERTENECE_A && tipoDe.get(destinoId) === TipoNodo.RAMA
        ? FUERZA_RAMA
        : 1 / Math.min(grado.get(origenId) ?? 1, grado.get(destinoId) ?? 1),
  }))
  const radioDe = ({ id }: NodoSimulacion) => radioDeCelda(tipoDe.get(id), celda)
  // Las paredes de la pantalla: ninguna celda sale del arco ni de la banda de los ojos. d3 mueve cada nodo DESPUÉS de
  // las fuerzas (x += vx), así que la pared recorta la velocidad, no la posición.
  const acotar = (valor: number, minimo: number, maximo: number) =>
    Math.min(maximo, Math.max(minimo, valor))
  const dentroDeLaPantalla: FuerzaPropia = () =>
    nodosSimulacion.forEach((nodo) => {
      const margen = radioDe(nodo)
      const { x = 0, y = 0, vx = 0, vy = 0 } = nodo
      nodo.vx = acotar(x + vx, -mitadAncho + margen, mitadAncho - margen) - x
      nodo.vy = acotar(y + vy, -mitadAlto + margen, mitadAlto - margen) - y
    })
  forceSimulation(nodosSimulacion, DIMENSIONES)
    .force(
      'enlace',
      forceLink(enlaces)
        .id(({ id }) => id)
        .distance(celda.ancho)
        .strength((enlace) => ('fuerza' in enlace ? Number(enlace.fuerza) : 1)),
    )
    .force('carga', forceManyBody().strength(CARGA).distanceMax(ALCANCE_CARGA))
    .force('choque', forceCollide().radius(radioDe).iterations(VUELTAS_CHOQUE))
    .force('pantalla', dentroDeLaPantalla)
    .stop()
    .tick(ticks)
  return nodosSimulacion.map(({ id, x = 0, y = 0 }) => {
    const altura = ALTURA_OJOS + y / aspecto
    return [id, enCilindro(centro + x / radio, altura, radio)] as const
  })
}

/**
 * Las sueltas en una grilla centrada en `centro`, de la más antigua a la más reciente (FASE 15: «ordenarlas por fecha»),
 * y por título si comparten fecha o no la tienen: se leen como una lista.
 */
function ubicarSueltas(
  sueltas: readonly Nodo[],
  arco: number,
  radio: number,
  centro: number,
  celda: Medidas,
): ReadonlyArray<readonly [string, Posicion]> {
  const columnas = Math.max(1, Math.floor((arco * radio) / celda.ancho))
  const filas = Math.ceil(sueltas.length / columnas)
  const ordenadas = sueltas.toSorted(
    (a, b) =>
      (a.fecha ?? '').localeCompare(b.fecha ?? '') ||
      a.titulo.localeCompare(b.titulo) ||
      a.id.localeCompare(b.id),
  )
  return ordenadas.map(({ id }, i) => {
    const columna = i % columnas
    const fila = Math.floor(i / columnas)
    const angulo = centro - arco / 2 + (arco * (columna + 0.5)) / columnas
    const altura = ALTURA_OJOS + ALTO_MEDIO - (2 * ALTO_MEDIO * (fila + 0.5)) / filas
    return [id, enCilindro(angulo, altura, radio)] as const
  })
}

/** Cuánto ocupan las sueltas: lo que su grilla necesita, acotado (ni un hilo ni la mitad de la abertura). */
function arcoDeSueltas(
  sueltas: number,
  total: number,
  radio: number,
  abertura: number,
  celda: Medidas,
): number {
  if (sueltas === 0) return 0
  if (sueltas === total) return abertura - HUECO
  const filasEnLaBanda = Math.max(1, Math.floor((2 * ALTO_MEDIO) / celda.alto))
  const necesario = (Math.ceil(sueltas / filasEnLaBanda) * celda.ancho) / radio
  const maximo = Math.min(ARCO_SUELTAS_MAXIMO, abertura / 2)
  return Math.min(maximo, Math.max(ARCO_SUELTAS_MINIMO, necesario))
}

/** Cuánto espacio necesitan `nodos` celdas con aire (m²). */
const areaNecesaria = (nodos: number, celda: Medidas) =>
  (nodos * celda.ancho * celda.alto) / LLENADO

/**
 * Cuántas líneas lleva cada etiqueta en una página (FASE 15, «si hay espacio, que se muestre»): la mayor que cabe en su
 * pantalla. Una página llena se queda en 2; una con aire sube hasta 4. El acomodo y el dibujo usan el mismo número.
 */
export function lineasPara(nodos: number, radio: number, abertura: number): number {
  const disponible = abertura * radio * 2 * ALTO_MEDIO
  const candidatas = Array.from(
    { length: LINEAS_MAXIMAS - LINEAS_MINIMAS + 1 },
    (_, i) => LINEAS_MAXIMAS - i,
  )
  return (
    candidatas.find(
      (lineas) => areaNecesaria(nodos, medidasEtiqueta(lineas).celda) <= disponible,
    ) ?? LINEAS_MINIMAS
  )
}

/** La abertura de una página: lo que sus celdas necesitan con aire, entre 180° y 270°. */
export function aberturaPara(nodos: number, radio: number): number {
  const necesaria = areaNecesaria(nodos, CELDA) / (2 * ALTO_MEDIO) / radio
  return Math.min(ABERTURA_PAGINA_MAXIMA, Math.max(ABERTURA_PAGINA_MINIMA, necesaria))
}

/**
 * `abertura` 2π: el grafo entero alrededor, lo conectado al frente y las sueltas detrás. Menos (una página, FASE 15):
 * centrada al frente, lo conectado a la izquierda y las sueltas al extremo derecho.
 */
export function calcularLayout(
  grafo: Grafo,
  radio: number = RADIO_PANORAMA,
  abertura: number = VUELTA,
  lineas: number = LINEAS_MINIMAS,
  ticks: number = TICKS_LAYOUT,
): ReadonlyMap<string, Posicion> {
  const { celda } = medidasEtiqueta(lineas)
  const conectadas = conConexion(grafo)
  const sueltas = grafo.nodos.filter(({ id }) => !conectadas.has(id))
  const vueltaCompleta = abertura >= VUELTA
  const arcoSueltas = arcoDeSueltas(sueltas.length, grafo.nodos.length, radio, abertura, celda)
  const huecosDeLaVuelta = sueltas.length > 0 ? 2 * HUECO : HUECO
  const huecosDeLaPagina = sueltas.length > 0 ? HUECO : 0
  const huecos = vueltaCompleta ? huecosDeLaVuelta : huecosDeLaPagina
  const arcoConectadas = abertura - arcoSueltas - huecos
  const centroConectadas = vueltaCompleta ? 0 : -abertura / 2 + arcoConectadas / 2
  const centroSueltas = vueltaCompleta ? Math.PI : abertura / 2 - arcoSueltas / 2
  const ubicadas =
    conectadas.size > 0
      ? ubicarConectadas(grafo, conectadas, arcoConectadas, radio, ticks, centroConectadas, celda)
      : []
  return new Map([...ubicadas, ...ubicarSueltas(sueltas, arcoSueltas, radio, centroSueltas, celda)])
}

/** Pocas vueltas: solo se acomoda lo que llega; lo demás ya está quieto. */
const TICKS_SEPARAR = 200
/** Lo que llega se queda cerca de sus vecinos, pero el choque manda. */
const FUERZA_HACIA_VECINOS = 0.3

/**
 * Lo que llega a una página ya acomodada —un nodo nuevo, o una invitada que vive en otra página (las hijas de una tarjeta
 * de «Sin HU»)— parte de donde lo dejó `ubicarFaltantes` y se separa con el mismo choque de celdas del acomodo, sin
 * mover lo guardado (fijo en d3). Sin esto, quince hijas de una misma madre caían una encima de otra.
 */
export function separarNuevas(
  grafo: Grafo,
  fijas: ReadonlyMap<string, Posicion>,
  nuevas: ReadonlyMap<string, Posicion>,
  radio: number,
  lineas: number = LINEAS_MINIMAS,
): ReadonlyMap<string, Posicion> {
  if (nuevas.size === 0) return nuevas
  const { celda } = medidasEtiqueta(lineas)
  const aspecto = celda.ancho / celda.alto
  const mitadAlto = ALTO_MEDIO * aspecto
  const tipoDe = new Map(grafo.nodos.map(({ id, tipo }) => [id, tipo]))
  const aPantalla = (p: Posicion) => ({ x: anguloDe(p) * radio, y: (p.y - ALTURA_OJOS) * aspecto })
  // d3 escribe x/y en estos objetos: son copias. Lo guardado lleva fx/fy: no se mueve.
  const nodosSimulacion: NodoSimulacion[] = [
    ...[...fijas].map(([id, p]) => {
      const { x, y } = aPantalla(p)
      return { id, x, y, fx: x, fy: y }
    }),
    ...[...nuevas].map(([id, p]) => ({ id, ...aPantalla(p) })),
  ]
  const presentes = new Set(nodosSimulacion.map(({ id }) => id))
  const enlaces = grafo.conexiones
    .filter(({ origenId, destinoId }) => presentes.has(origenId) && presentes.has(destinoId))
    .map(({ origenId, destinoId }) => ({ source: origenId, target: destinoId }))
  const radioDe = ({ id }: NodoSimulacion) => radioDeCelda(tipoDe.get(id), celda)
  const enLaBanda: FuerzaPropia = () =>
    nodosSimulacion
      .filter(({ fx }) => fx === undefined)
      .forEach((nodo) => {
        const margen = radioDe(nodo)
        const { y = 0, vy = 0 } = nodo
        nodo.vy = Math.min(mitadAlto - margen, Math.max(-mitadAlto + margen, y + vy)) - y
      })
  forceSimulation(nodosSimulacion, DIMENSIONES)
    .force(
      'enlace',
      forceLink(enlaces)
        .id(({ id }) => id)
        .distance(celda.ancho)
        .strength(FUERZA_HACIA_VECINOS),
    )
    .force('choque', forceCollide().radius(radioDe).iterations(VUELTAS_CHOQUE))
    .force('banda', enLaBanda)
    .stop()
    .tick(TICKS_SEPARAR)
  return new Map(
    nodosSimulacion
      .filter(({ id }) => nuevas.has(id))
      .map(({ id, x = 0, y = 0 }) => [id, enCilindro(x / radio, ALTURA_OJOS + y / aspecto, radio)]),
  )
}
