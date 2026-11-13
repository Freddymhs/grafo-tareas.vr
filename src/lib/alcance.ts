// El alcance de la vista (FASE 24 y 26): qué espacio y proyecto se ven. Puro; la API filtra, acá solo se traduce.
import type { EspacioResponseDto, PaginaDto, ProyectoResponseDto } from './api/generado/modelos'
import {
  AVISO_ESPACIO_INEXISTENTE,
  AVISO_PROYECTO_INEXISTENTE,
  ID_PAGINA_UNICA,
  MIN_PROYECTOS_CON_FILA,
} from './constants/alcance'
import { Cara, EstadoNodo, type Nodo } from './dominio'

export interface Alcance {
  readonly espacioId: string | null
  readonly proyectoId: string | null
}

interface Ordenable {
  readonly orden: number
  readonly archivado: boolean
}

export const vigentesPorOrden = <T extends Ordenable>(items: readonly T[]): T[] =>
  items.filter(({ archivado }) => !archivado).sort((a, b) => a.orden - b.orden)

/** Los proyectos de la fila (FASE 26, D2): los vigentes por orden si son dos o más; si no, ninguno (se ve el espacio entero). */
export function proyectosConFila<T extends Ordenable>(proyectos: readonly T[]): T[] {
  const vigentes = vigentesPorOrden(proyectos)
  return vigentes.length >= MIN_PROYECTOS_CON_FILA ? vigentes : []
}

export interface ParamsDeAlcance {
  readonly proyecto?: string
  readonly espacio?: string
}

export function paramsDeAlcance({ espacioId, proyectoId }: Alcance): ParamsDeAlcance {
  if (proyectoId) return { proyecto: proyectoId }
  if (espacioId) return { espacio: espacioId }
  return {}
}

/** Un espacio sin método no tiene HU (`/derivado/paginas` es del método): el proyecto entero es una página (D10). */
export function paginaUnica(nodos: readonly Nodo[], titulo: string): PaginaDto {
  return {
    id: ID_PAGINA_UNICA,
    libro: ID_PAGINA_UNICA,
    cara: Cara.REAL,
    titulo,
    historiaId: null,
    nodos: nodos.map(({ id }) => id),
    abiertas: nodos.filter(({ estado }) => estado === EstadoNodo.ABIERTO).length,
    frenan: [],
  }
}

export interface AlcanceResuelto {
  readonly alcance: Alcance
  readonly aviso: string | null
}

export interface EspacioResuelto {
  readonly espacioId: string | null
  readonly aviso: string | null
}

/**
 * El espacio que se ve (FASE 26, D1): el pedido si existe; si no se pidió, el primero por orden; si ya no existe
 * (archivado, borrado o de otra base), el primero con aviso: nunca una pantalla vacía sin explicación. `null` solo sin
 * espacios.
 */
export function resolverEspacio(
  espacioId: string | null,
  espacios: readonly EspacioResponseDto[],
): EspacioResuelto {
  const vigentes = vigentesPorOrden(espacios)
  const primero = vigentes[0]?.id ?? null
  if (espacioId === null) return { espacioId: primero, aviso: null }
  if (vigentes.some(({ id }) => id === espacioId)) return { espacioId, aviso: null }
  return { espacioId: primero, aviso: AVISO_ESPACIO_INEXISTENTE }
}

/**
 * El alcance que se ve (FASE 26, D1 y D2). `proyectos` son los del espacio resuelto (`undefined` mientras cargan). Sin
 * fila de proyectos (0 o 1 vigente) se ve el espacio entero; con fila, el proyecto pedido o, si no se pidió o ya no
 * existe, el primero (con aviso si no existe).
 */
export function resolverAlcance(
  pedido: Alcance,
  espacios: readonly EspacioResponseDto[],
  proyectos: readonly ProyectoResponseDto[] | undefined,
): AlcanceResuelto {
  const { espacioId, aviso } = resolverEspacio(pedido.espacioId, espacios)
  const proyectoPedido = espacioId === pedido.espacioId ? pedido.proyectoId : null
  if (espacioId === null || proyectos === undefined)
    return { alcance: { espacioId, proyectoId: proyectoPedido }, aviso }
  const conFila = proyectosConFila(proyectos)
  const primero = conFila[0]?.id ?? null
  if (proyectoPedido === null || primero === null)
    return { alcance: { espacioId, proyectoId: primero }, aviso }
  if (conFila.some(({ id }) => id === proyectoPedido))
    return { alcance: { espacioId, proyectoId: proyectoPedido }, aviso }
  return { alcance: { espacioId, proyectoId: primero }, aviso: AVISO_PROYECTO_INEXISTENTE }
}
