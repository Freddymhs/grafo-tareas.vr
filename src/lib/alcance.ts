// El alcance de la vista (FASE 24): qué espacio y proyecto se ven. Puro; la API filtra, acá solo se traduce.
import type { EspacioResponseDto, PaginaDto, ProyectoResponseDto } from './api/generado/modelos'
import {
  AVISO_ESPACIO_INEXISTENTE,
  AVISO_PROYECTO_INEXISTENTE,
  ID_PAGINA_UNICA,
} from './constants/alcance'
import { Cara, EstadoNodo, type Nodo } from './dominio'

export interface Alcance {
  readonly espacioId: string | null
  readonly proyectoId: string | null
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

const TODO: Alcance = { espacioId: null, proyectoId: null }

/** Un id de la URL o de la última vista que ya no existe se descarta con aviso: nunca una pantalla vacía sin explicación (D3). */
export function resolverAlcance(
  { espacioId, proyectoId }: Alcance,
  espacios: readonly EspacioResponseDto[],
  proyectos: readonly ProyectoResponseDto[] | undefined,
): AlcanceResuelto {
  if (!espacioId) return { alcance: TODO, aviso: null }
  if (!espacios.some(({ id }) => id === espacioId))
    return { alcance: TODO, aviso: AVISO_ESPACIO_INEXISTENTE }
  if (!proyectoId || proyectos === undefined)
    return { alcance: { espacioId, proyectoId }, aviso: null }
  if (!proyectos.some(({ id }) => id === proyectoId))
    return { alcance: { espacioId, proyectoId: null }, aviso: AVISO_PROYECTO_INEXISTENTE }
  return { alcance: { espacioId, proyectoId }, aviso: null }
}
