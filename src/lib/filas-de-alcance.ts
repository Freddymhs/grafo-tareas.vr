// Las pestañas de la barra superior (FASE 24, D2): la fila de espacios y, con uno elegido, la de sus proyectos. Crear
// espacios y proyectos es de la web. Puro.
import type { EspacioResponseDto, ProyectoResponseDto } from './api/generado/modelos'
import type { Alcance } from './alcance'
import {
  LARGO_PESTANA,
  MAX_PESTANAS_FILA,
  TEXTO_TODO,
  TEXTO_TODO_EL_ESPACIO,
} from './constants/alcance'
import { textoVisible } from './texto-visible'

export interface Pestana {
  /** `null` = «Todo» / «Todo el espacio». */
  readonly id: string | null
  readonly texto: string
  readonly activa: boolean
  readonly color: string | null
}

export interface FilasDeAlcance {
  readonly espacios: readonly Pestana[]
  readonly proyectos: readonly Pestana[]
}

interface Ordenable {
  readonly orden: number
  readonly archivado: boolean
}

const vigentesPorOrden = <T extends Ordenable>(items: readonly T[]): T[] =>
  items.filter(({ archivado }) => !archivado).sort((a, b) => a.orden - b.orden)

/** Lo que cabe en la fila, desplazada lo justo para que la pestaña activa siga a la vista. */
function ventanaConLaActiva(pestanas: readonly Pestana[], lugares: number): readonly Pestana[] {
  if (pestanas.length <= lugares) return pestanas
  const posicionActiva = Math.max(
    0,
    pestanas.findIndex(({ activa }) => activa),
  )
  const inicio = Math.max(0, posicionActiva - lugares + 1)
  return pestanas.slice(inicio, inicio + lugares)
}

const deItem = (
  { id, nombre, color }: { id: string; nombre: string; color?: string | null },
  activa: boolean,
): Pestana => ({ id, texto: textoVisible(nombre, LARGO_PESTANA), activa, color: color ?? null })

export function filasDeAlcance(
  espacios: readonly EspacioResponseDto[],
  proyectos: readonly ProyectoResponseDto[],
  { espacioId, proyectoId }: Alcance,
): FilasDeAlcance {
  const delosEspacios = vigentesPorOrden(espacios).map((item) =>
    deItem(item, item.id === espacioId),
  )
  const todo: Pestana = { id: null, texto: TEXTO_TODO, activa: espacioId === null, color: null }
  const filaEspacios = [...ventanaConLaActiva(delosEspacios, MAX_PESTANAS_FILA - 1), todo]
  if (espacioId === null) return { espacios: filaEspacios, proyectos: [] }

  const delosProyectos = vigentesPorOrden(proyectos).map((item) =>
    deItem(item, item.id === proyectoId),
  )
  const todoElEspacio: Pestana = {
    id: null,
    texto: TEXTO_TODO_EL_ESPACIO,
    activa: proyectoId === null,
    color: null,
  }
  return {
    espacios: filaEspacios,
    proyectos: [todoElEspacio, ...ventanaConLaActiva(delosProyectos, MAX_PESTANAS_FILA - 1)],
  }
}
