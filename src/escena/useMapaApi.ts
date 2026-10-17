// El grafo real: lo pide a la API, decide las posiciones y guarda las que faltaban (FASE 6, tareas 1 y 2).
// Primera vez (nada guardado) → layout de fuerzas en el Worker → PUT de todas. Después → las guardadas, y los
// nodos nuevos junto a sus vecinos (`ubicarFaltantes`) → PUT solo de esos. El mapa no cambia de un día a otro.
// `reordenar` (FASE 13): cuando el árbol cambió, el layout se rehace entero con las conexiones de hoy y se guarda.
import { useEffect, useMemo, useRef } from 'react'
import { useConexionesControllerFindAll } from '../lib/api/generado/conexiones/conexiones'
import {
  useNodosControllerFindAll,
  useNodosControllerGuardarPosiciones,
} from '../lib/api/generado/nodos/nodos'
import { API_URL, LIMITE_GRAFO } from '../lib/constants/api'
import { aGrafo, posicionesGuardadas } from '../lib/desde-api'
import type { Grafo, Posicion } from '../lib/dominio'
import { ubicarFaltantes } from '../lib/ubicar'
import { useLayout } from './useLayout'

export type EstadoMapa =
  | { readonly estado: 'cargando'; readonly mensaje: string }
  | { readonly estado: 'error'; readonly mensaje: string }
  | {
      readonly estado: 'listo'
      readonly grafo: Grafo
      readonly posiciones: ReadonlyMap<string, Posicion>
      /** Si guardar las posiciones nuevas falló: el mapa se ve igual, pero la próxima vez se recalcula. */
      readonly aviso: string | null
    }

export function useMapaApi(reordenar = false): EstadoMapa {
  const nodos = useNodosControllerFindAll({ limit: LIMITE_GRAFO })
  const conexiones = useConexionesControllerFindAll()
  const guardar = useNodosControllerGuardarPosiciones()
  const guardadoPara = useRef<string | null>(null)

  const grafo = useMemo(
    () => (nodos.data && conexiones.data ? aGrafo(nodos.data.data, conexiones.data) : null),
    [nodos.data, conexiones.data],
  )
  const guardadas = useMemo(
    () => (nodos.data ? posicionesGuardadas(nodos.data.data) : new Map<string, Posicion>()),
    [nodos.data],
  )
  const mapaVacio = grafo !== null && grafo.nodos.length > 0 && (guardadas.size === 0 || reordenar)
  const layout = useLayout(mapaVacio ? grafo : null)
  const ubicacion = useMemo(() => {
    if (!grafo) return null
    if (mapaVacio) return layout ? { posiciones: layout, nuevas: layout } : null
    return ubicarFaltantes(grafo, guardadas)
  }, [grafo, guardadas, mapaVacio, layout])

  const { mutate } = guardar
  useEffect(() => {
    if (!ubicacion || ubicacion.nuevas.size === 0) return
    // Una sola vez por conjunto de nodos nuevos: un re-render no vuelve a mandar el mismo lote.
    const clave = [...ubicacion.nuevas.keys()].sort().join(',')
    if (guardadoPara.current === clave) return
    guardadoPara.current = clave
    mutate({
      data: {
        posiciones: [...ubicacion.nuevas].map(([id, { x, y, z }]) => ({ id, x, y, z })),
      },
    })
  }, [ubicacion, mutate])

  if (nodos.isError || conexiones.isError) {
    return { estado: 'error', mensaje: `No se pudo leer la API en ${API_URL}` }
  }
  if (!grafo) return { estado: 'cargando', mensaje: 'Leyendo el grafo…' }
  if (!ubicacion) return { estado: 'cargando', mensaje: 'Armando el mapa por primera vez…' }
  return {
    estado: 'listo',
    grafo,
    posiciones: ubicacion.posiciones,
    aviso: guardar.isError ? 'No se pudieron guardar las posiciones nuevas' : null,
  }
}
