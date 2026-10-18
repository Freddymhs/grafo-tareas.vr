// El grafo real, una página (una HU) a la vez (FASE 15). Qué hay en cada página lo decide la API
// (`GET /derivado/paginas`); acá se recorta el grafo a la página, se decide dónde va cada nodo y se guardan las posiciones
// que faltaban (C2). Cada página guarda su acomodo: la primera vez (sus nodos sin posición) o con `reordenar`, el layout
// de la página en el Worker → PUT de sus nodos. Después, las guardadas, y lo nuevo junto a sus vecinos (`ubicarFaltantes`).
// Un nodo que también está en otra página (una persona que bloquea en dos HU) se guarda en la primera («hogar») y en las
// demás se ubica junto a sus vecinos sin pisarla. Los colores salen del grafo entero: las ramas no son contenido de página.
import { useEffect, useMemo, useRef } from 'react'
import { useConexionesControllerFindAll } from '../lib/api/generado/conexiones/conexiones'
import { useDerivadoControllerPaginas } from '../lib/api/generado/derivado/derivado'
import {
  useNodosControllerFindAll,
  useNodosControllerGuardarPosiciones,
} from '../lib/api/generado/nodos/nodos'
import { coloresPorNodo } from '../lib/colores'
import { API_URL, LIMITE_GRAFO } from '../lib/constants/api'
import { aGrafo, posicionesGuardadas } from '../lib/desde-api'
import { TipoNodo, type Grafo, type Nodo, type Posicion } from '../lib/dominio'
import { useEstadoVr } from '../lib/estado-vr'
import { RADIO_PANORAMA, aberturaPara, lineasPara } from '../lib/layout'
import { grafoDePagina, hogares } from '../lib/paginas'
import { ubicarFaltantes } from '../lib/ubicar'
import { useLayout } from './useLayout'

export interface PaginaVisible {
  readonly titulo: string
  readonly indice: number
  readonly total: number
}

export type EstadoMapa =
  | { readonly estado: 'cargando'; readonly mensaje: string }
  | { readonly estado: 'error'; readonly mensaje: string }
  | {
      readonly estado: 'listo'
      /** Solo la página que se ve. */
      readonly grafo: Grafo
      readonly posiciones: ReadonlyMap<string, Posicion>
      /** Del grafo entero: la rama de una tarjeta no está en su página. */
      readonly colores: ReadonlyMap<string, string>
      /** Las ramas de colores, para la leyenda. */
      readonly ramas: readonly Nodo[]
      readonly pagina: PaginaVisible
      /** Líneas de cada etiqueta en esta página: más donde hay espacio (FASE 15). */
      readonly lineas: number
      /** Si guardar las posiciones nuevas falló: el mapa se ve igual, pero la próxima vez se recalcula. */
      readonly aviso: string | null
    }

const SIN_GUARDADAS: ReadonlyMap<string, Posicion> = new Map()

export function useMapaApi(reordenar = false, radio = RADIO_PANORAMA): EstadoMapa {
  const nodos = useNodosControllerFindAll({ limit: LIMITE_GRAFO })
  const conexiones = useConexionesControllerFindAll()
  const paginas = useDerivadoControllerPaginas()
  const indicePedido = useEstadoVr((estado) => estado.pagina)
  const guardar = useNodosControllerGuardarPosiciones()
  const guardadoPara = useRef<string | null>(null)

  const grafo = useMemo(
    () => (nodos.data && conexiones.data ? aGrafo(nodos.data.data, conexiones.data) : null),
    [nodos.data, conexiones.data],
  )
  const colores = useMemo(() => (grafo ? coloresPorNodo(grafo) : null), [grafo])
  const ramas = useMemo(
    () => (grafo ? grafo.nodos.filter(({ tipo }) => tipo === TipoNodo.RAMA) : []),
    [grafo],
  )
  const lista = paginas.data
  const total = lista?.length ?? 0
  const indice = total > 0 ? indicePedido % total : 0
  const pagina = lista && total > 0 ? lista[indice] : null
  const grafoPagina = useMemo(
    () => (grafo && pagina ? grafoDePagina(grafo, pagina.nodos) : null),
    [grafo, pagina],
  )
  const hogar = useMemo(() => hogares(lista ?? []), [lista])
  const guardadas = useMemo(() => {
    if (!nodos.data || !pagina) return SIN_GUARDADAS
    const todas = posicionesGuardadas(nodos.data.data)
    return new Map([...todas].filter(([id]) => hogar.get(id) === pagina.id))
  }, [nodos.data, pagina, hogar])
  const abertura = aberturaPara(grafoPagina?.nodos.length ?? 0, radio)
  const lineas = lineasPara(grafoPagina?.nodos.length ?? 0, radio, abertura)
  const sinAcomodo =
    grafoPagina !== null && grafoPagina.nodos.length > 0 && (guardadas.size === 0 || reordenar)
  const layout = useLayout(sinAcomodo ? grafoPagina : null, radio, abertura, lineas)
  const ubicacion = useMemo(() => {
    if (!grafoPagina) return null
    if (sinAcomodo) return layout ? { posiciones: layout, nuevas: layout } : null
    // Lo nuevo sin vecinos va al extremo derecho de la página, donde el acomodo pone las sueltas.
    return ubicarFaltantes(grafoPagina, guardadas, abertura / 2)
  }, [grafoPagina, guardadas, sinAcomodo, layout, abertura])

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
  if (!ubicacion) return { estado: 'cargando', mensaje: `Acomodando ${pagina.titulo}…` }
  return {
    estado: 'listo',
    grafo: grafoPagina,
    posiciones: ubicacion.posiciones,
    colores,
    ramas,
    pagina: { titulo: pagina.titulo, indice, total },
    lineas,
    aviso: guardar.isError ? 'No se pudieron guardar las posiciones nuevas' : null,
  }
}
