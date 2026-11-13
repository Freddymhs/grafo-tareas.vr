// Las pestañas de la barra superior (FASE 26, D1 y D2): la fila de espacios, solo espacios, y la de proyectos, solo si el
// espacio tiene dos o más. Crear espacios y proyectos es de la web. Puro.
import type { EspacioResponseDto, ProyectoResponseDto } from './api/generado/modelos'
import { type Alcance, proyectosConFila, vigentesPorOrden } from './alcance'
import { LARGO_PESTANA, MAX_PESTANAS_FILA } from './constants/alcance'
import { textoVisible } from './texto-visible'

export interface Pestana {
  readonly id: string
  readonly texto: string
  readonly activa: boolean
  readonly color: string | null
}

export interface FilasDeAlcance {
  readonly espacios: readonly Pestana[]
  readonly proyectos: readonly Pestana[]
}

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
  const delosProyectos = proyectosConFila(proyectos).map((item) =>
    deItem(item, item.id === proyectoId),
  )
  return {
    espacios: ventanaConLaActiva(delosEspacios, MAX_PESTANAS_FILA),
    proyectos: ventanaConLaActiva(delosProyectos, MAX_PESTANAS_FILA),
  }
}
