// El directorio de proyectos (FASE 24, D8): de qué proyecto y espacio es cada nodo, para rotular los fantasmas. Es la
// misma lógica que la de la web (`src/lib/alcance/directorio.ts`): son repos distintos y no hay paquete compartido.
import type { EspacioResponseDto, ProyectoResponseDto } from './api/generado/modelos'
import { NOMBRE_OTRO_PROYECTO, SUFIJO_ARCHIVADO } from './constants/alcance'

export interface EntradaDirectorio {
  readonly proyecto: string
  readonly espacio: string
  readonly espacioId: string
  readonly archivado: boolean
}

export type Directorio = ReadonlyMap<string, EntradaDirectorio>

const SEPARADOR_ROTULO = ' · '

export function armarDirectorio(
  espacios: readonly EspacioResponseDto[],
  proyectosPorEspacio: Readonly<Record<string, readonly ProyectoResponseDto[]>>,
): Directorio {
  const directorio = new Map<string, EntradaDirectorio>()
  for (const espacio of espacios) {
    for (const proyecto of proyectosPorEspacio[espacio.id] ?? []) {
      directorio.set(proyecto.id, {
        proyecto: proyecto.nombre,
        espacio: espacio.nombre,
        espacioId: espacio.id,
        archivado: proyecto.archivado || espacio.archivado,
      })
    }
  }
  return directorio
}

export function rotuloFantasma(
  proyectoId: string,
  proyectoDeReferenciaId: string | undefined,
  directorio: Directorio,
): string | null {
  if (!proyectoDeReferenciaId || proyectoId === proyectoDeReferenciaId) return null
  const entrada = directorio.get(proyectoId)
  if (!entrada) return NOMBRE_OTRO_PROYECTO
  const partes = [
    entrada.proyecto,
    entrada.espacio,
    ...(entrada.archivado ? [SUFIJO_ARCHIVADO] : []),
  ]
  return partes.join(SEPARADOR_ROTULO)
}

/** El título de un fantasma lleva delante su proyecto: el recorte de `textoVisible` no se lo come. */
export function conRotulo(texto: string, rotulo: string | undefined): string {
  return rotulo ? `(${rotulo}) ${texto}` : texto
}
