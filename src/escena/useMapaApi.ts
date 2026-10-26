// El grafo real, una página (una HU) a la vez (FASE 15), y de cada HU una cara: lo real o el plan (FASE 17). Qué hay en
// cada página lo decide la API (`GET /derivado/paginas`); acá se recorta el grafo a la página, se decide dónde va cada
// nodo y se guardan las posiciones que faltaban (C2). Cada página —cada cara— guarda su acomodo: la primera vez (sus
// nodos sin posición) o con `reordenar`, el layout de la página en el Worker → PUT de sus nodos. Después, las guardadas, y lo nuevo junto a sus vecinos (`ubicarFaltantes`).
// Un nodo que también está en otra página (una persona que bloquea en dos HU) se guarda en la primera («hogar») y en las
// demás se ubica junto a sus vecinos sin pisarla. Los colores salen del grafo entero: las ramas no son contenido de página.
import { useEffect, useMemo, useRef } from 'react'
import { useConexionesControllerFindAll } from '../lib/api/generado/conexiones/conexiones'
import {
  useDerivadoControllerPaginas,
  useDerivadoControllerPlan,
} from '../lib/api/generado/derivado/derivado'
import {
  useNodosControllerFindAll,
  useNodosControllerGuardarPosiciones,
} from '../lib/api/generado/nodos/nodos'
import { centrarEn } from '../lib/centrar'
import { coloresPorNodo } from '../lib/colores'
import { API_URL, LIMITE_GRAFO } from '../lib/constants/api'
import { aGrafo, posicionesGuardadas } from '../lib/desde-api'
import { Cara, TipoNodo, type Grafo, type Nodo, type Posicion } from '../lib/dominio'
import { useEstadoVr } from '../lib/estado-vr'
import {
  RADIO_PANORAMA,
  aberturaPara,
  lineasPara,
  lineasQueCaben,
  separarNuevas,
} from '../lib/layout'
import {
  caraVisible,
  grafoDePagina,
  hogares,
  librosDe,
  otraCara,
  ramasDePagina,
  sinPadre,
} from '../lib/paginas'
import { marcasDelPlan, type MarcaDelPlan } from '../lib/plan'
import { ubicarFaltantes } from '../lib/ubicar'
import { useLayout } from './useLayout'

export interface PaginaVisible {
  readonly titulo: string
  /** El libro (la HU) entre todos: lo que cambian X / Y y girar la pelota. */
  readonly indice: number
  readonly total: number
  readonly cara: Cara
  /** La cara a la que lleva dar vuelta la hoja; `null` si la HU no tiene plan. */
  readonly otra: Cara | null
}

export type EstadoMapa =
  | { readonly estado: 'cargando'; readonly mensaje: string }
  | { readonly estado: 'error'; readonly mensaje: string }
  | {
      readonly estado: 'listo'
      /** Solo la página que se ve. */
      readonly grafo: Grafo
      /** Para la vista: la página girada con su HU al frente (`centrarEn`); lo guardado no cambia. */
      readonly posiciones: ReadonlyMap<string, Posicion>
      /** Del grafo entero: la rama de una tarjeta no está en su página. */
      readonly colores: ReadonlyMap<string, string>
      /** Las ramas que colorean esta página, para la leyenda. */
      readonly ramas: readonly Nodo[]
      readonly pagina: PaginaVisible
      /** Líneas de cada etiqueta en esta página: más donde hay espacio (FASE 15). */
      readonly lineas: number
      /** Las tareas sin padre (calculado sobre el grafo entero): llevan su fecha a la vista. */
      readonly conFecha: ReadonlySet<string>
      /** Lo que frena en la página, según la API (filtro 4); `null` si la API todavía no lo manda. */
      readonly frenan: ReadonlySet<string> | null
      /** En la cara plan: el número de cada pieza en su carril y los carriles que espera (`GET /derivado/plan`). */
      readonly marcas: ReadonlyMap<string, MarcaDelPlan>
      /** Si guardar las posiciones nuevas falló: el mapa se ve igual, pero la próxima vez se recalcula. */
      readonly aviso: string | null
    }

const SIN_GUARDADAS: ReadonlyMap<string, Posicion> = new Map()
const NINGUNO: ReadonlySet<string> = new Set()
const SIN_MARCAS: ReadonlyMap<string, MarcaDelPlan> = new Map()

export function useMapaApi(reordenar = false, radio = RADIO_PANORAMA): EstadoMapa {
  const nodos = useNodosControllerFindAll({ limit: LIMITE_GRAFO })
  const conexiones = useConexionesControllerFindAll()
  const paginas = useDerivadoControllerPaginas()
  const indicePedido = useEstadoVr((estado) => estado.libro)
  const caraPedida = useEstadoVr((estado) => estado.cara)
  const guardar = useNodosControllerGuardarPosiciones()
  const guardadoPara = useRef<string | null>(null)

  const grafo = useMemo(
    () => (nodos.data && conexiones.data ? aGrafo(nodos.data.data, conexiones.data) : null),
    [nodos.data, conexiones.data],
  )
  const colores = useMemo(() => (grafo ? coloresPorNodo(grafo) : null), [grafo])
  // Solo las TAREAS: la HU se reconoce por su nombre, y lo que viene de los archivos FASE (una duda) no tiene fecha
  // de origen real (la suya es la de la importación) y mostrarla engañaría.
  const conFecha = useMemo(() => {
    if (!grafo) return NINGUNO
    const raices = sinPadre(grafo)
    return new Set(
      grafo.nodos
        .filter(({ id, tipo }) => tipo === TipoNodo.TAREA && raices.has(id))
        .map(({ id }) => id),
    )
  }, [grafo])
  const lista = paginas.data
  const libros = useMemo(() => librosDe(lista ?? []), [lista])
  const total = libros.length
  const indice = total > 0 ? indicePedido % total : 0
  const libro = total > 0 ? libros[indice] : null
  const pagina = libro ? caraVisible(libro, caraPedida) : null
  const otra = libro ? otraCara(libro, caraPedida) : null
  const enPlan = pagina?.cara === Cara.PLAN
  const plan = useDerivadoControllerPlan(enPlan ? { libro: pagina.libro } : undefined, {
    query: { enabled: enPlan },
  })
  // Una API anterior al número del plan no manda `orden`: entonces no se dibuja nada encima de las piezas.
  const marcas = useMemo(
    () =>
      enPlan && plan.data?.every(({ nodos }) => nodos.every(({ orden }) => orden !== undefined))
        ? marcasDelPlan(plan.data)
        : SIN_MARCAS,
    [enPlan, plan.data],
  )
  // Una API anterior al filtro 4 no manda `frenan`: entonces el filtro vuelve a elegir por tipo.
  const frenan = useMemo(
    () => (pagina && Array.isArray(pagina.frenan) ? new Set(pagina.frenan) : null),
    [pagina],
  )
  const grafoPagina = useMemo(
    () => (grafo && pagina ? grafoDePagina(grafo, pagina.nodos) : null),
    [grafo, pagina],
  )
  // La leyenda, por página: solo las ramas que colorean lo que se ve.
  const ramas = useMemo(() => {
    if (!grafo || !pagina) return []
    const deLaPagina = ramasDePagina(grafo, pagina.nodos)
    return grafo.nodos.filter(({ id }) => deLaPagina.has(id))
  }, [grafo, pagina])
  const hogar = useMemo(() => hogares(lista ?? []), [lista])
  const guardadas = useMemo(() => {
    if (!nodos.data || !pagina) return SIN_GUARDADAS
    const todas = posicionesGuardadas(nodos.data.data)
    return new Map([...todas].filter(([id]) => hogar.get(id) === pagina.id))
  }, [nodos.data, pagina, hogar])
  const abertura = aberturaPara(grafoPagina?.nodos.length ?? 0, radio)
  const sinAcomodo =
    grafoPagina !== null && grafoPagina.nodos.length > 0 && (guardadas.size === 0 || reordenar)
  const lineasPorEspacio = lineasPara(grafoPagina?.nodos.length ?? 0, radio, abertura)
  const layout = useLayout(sinAcomodo ? grafoPagina : null, radio, abertura, lineasPorEspacio)
  const ubicacion = useMemo(() => {
    if (!grafoPagina) return null
    // Un acomodo nuevo usa las líneas que da el espacio.
    if (sinAcomodo)
      return layout ? { posiciones: layout, nuevas: layout, lineas: lineasPorEspacio } : null
    // Lo nuevo sin vecinos va al extremo derecho de la página, donde el acomodo pone las sueltas; después, lo que llega
    // (nuevo o invitado de otra página) se separa sin mover lo guardado. Uno guardado sube de líneas solo mientras sus
    // posiciones —con lo que llegó— no se pisen (`lineasQueCaben`).
    const { nuevas } = ubicarFaltantes(grafoPagina, guardadas, abertura / 2)
    const separadas = separarNuevas(grafoPagina, guardadas, nuevas, radio, lineasPorEspacio)
    const posiciones = new Map([...guardadas, ...separadas])
    const lineas = lineasQueCaben([...posiciones.values()], lineasPorEspacio, radio)
    return { posiciones, nuevas: separadas, lineas }
  }, [grafoPagina, guardadas, sinAcomodo, layout, abertura, radio, lineasPorEspacio])
  const historia = pagina?.historiaId ?? null
  const posicionesVista = useMemo(
    () => (ubicacion ? centrarEn(ubicacion.posiciones, historia) : null),
    [ubicacion, historia],
  )

  const { mutate } = guardar
  useEffect(() => {
    if (!ubicacion || !pagina) return
    // Solo lo de esta página: un nodo de otra página guarda la posición de la suya.
    const aGuardar = [...ubicacion.nuevas].filter(([id]) => hogar.get(id) === pagina.id)
    if (aGuardar.length === 0) return
    // Una sola vez por página y conjunto de nodos: un re-render no vuelve a mandar el mismo lote.
    const ids = aGuardar.map(([id]) => id).sort()
    const clave = `${pagina.id}:${ids.join(',')}`
    if (guardadoPara.current === clave) return
    guardadoPara.current = clave
    mutate({ data: { posiciones: aGuardar.map(([id, { x, y, z }]) => ({ id, x, y, z })) } })
  }, [ubicacion, pagina, hogar, mutate])

  if (nodos.isError || conexiones.isError || paginas.isError) {
    return { estado: 'error', mensaje: `No se pudo leer la API en ${API_URL}` }
  }
  if (!grafo || !colores || !lista) return { estado: 'cargando', mensaje: 'Leyendo el grafo…' }
  if (!pagina || !grafoPagina) return { estado: 'error', mensaje: 'El grafo no tiene páginas' }
  if (!ubicacion || !posicionesVista)
    return { estado: 'cargando', mensaje: `Acomodando ${pagina.titulo}…` }
  return {
    estado: 'listo',
    grafo: grafoPagina,
    posiciones: posicionesVista,
    colores,
    ramas,
    pagina: { titulo: pagina.titulo, indice, total, cara: pagina.cara, otra },
    lineas: ubicacion.lineas,
    conFecha,
    frenan,
    marcas,
    aviso: guardar.isError ? 'No se pudieron guardar las posiciones nuevas' : null,
  }
}
