// El alcance que se ve (FASE 24 y 26): la pestaña pedida contra lo que la API tiene. Nunca es «todo»: sin espacio pedido
// se ve el primero, y con fila de proyectos, su primer proyecto. Se espera a saber los espacios y los proyectos del que
// se ve antes de pedir nada. Lo comparten el mapa, las barras y los filtros.
import { useMemo } from 'react'
import {
  type Alcance,
  type ParamsDeAlcance,
  paramsDeAlcance,
  resolverAlcance,
  resolverEspacio,
} from '../lib/alcance'
import type {
  EspacioResponseDto,
  ProyectoResponseDto,
  TipoNodoResponseDto,
} from '../lib/api/generado/modelos'
import { useEspaciosControllerFindAll } from '../lib/api/generado/espacios/espacios'
import { useProyectosControllerListarDeEspacio } from '../lib/api/generado/proyectos/proyectos'
import { useTiposControllerListarNodo } from '../lib/api/generado/tipos/tipos'
import { useEstadoVr } from '../lib/estado-vr'

const SIN_ID = ''

export interface AlcanceVr {
  readonly alcance: Alcance
  readonly aviso: string | null
  readonly params: ParamsDeAlcance
  readonly espacios: readonly EspacioResponseDto[] | undefined
  readonly proyectos: readonly ProyectoResponseDto[] | undefined
  readonly espacio: EspacioResponseDto | undefined
  readonly proyecto: ProyectoResponseDto | undefined
  /** Los tipos de nodo del espacio que se ve (`GET /espacios/:id/tipos-nodo`), en su orden. */
  readonly tipos: readonly TipoNodoResponseDto[] | undefined
  /** `false` mientras no se saben los espacios y los proyectos del que se ve: no se pide nada con un alcance a medias. */
  readonly verificado: boolean
  /** No se pudieron leer los espacios o los proyectos: sin ellos no hay alcance. */
  readonly fallo: boolean
  readonly conMetodo: boolean
}

export function useAlcanceVr(): AlcanceVr {
  const espacioPedido = useEstadoVr((estado) => estado.espacioId)
  const proyectoPedido = useEstadoVr((estado) => estado.proyectoId)
  const espacios = useEspaciosControllerFindAll()
  const { espacioId: espacioVisto } = resolverEspacio(espacioPedido, espacios.data ?? [])
  const proyectos = useProyectosControllerListarDeEspacio(espacioVisto ?? SIN_ID, undefined, {
    query: { enabled: espacioVisto !== null },
  })
  const tipos = useTiposControllerListarNodo(espacioVisto ?? SIN_ID, {
    query: { enabled: espacioVisto !== null },
  })
  const { alcance, aviso } = useMemo(
    () =>
      resolverAlcance(
        { espacioId: espacioPedido, proyectoId: proyectoPedido },
        espacios.data ?? [],
        proyectos.data,
      ),
    [espacioPedido, proyectoPedido, espacios.data, proyectos.data],
  )
  const espacio = espacios.data?.find(({ id }) => id === alcance.espacioId)
  const proyecto = proyectos.data?.find(({ id }) => id === alcance.proyectoId)
  const params = useMemo(() => paramsDeAlcance(alcance), [alcance])
  return {
    alcance,
    aviso: espacios.isSuccess ? aviso : null,
    params,
    espacios: espacios.data,
    proyectos: proyectos.data,
    espacio,
    proyecto,
    tipos: tipos.data,
    verificado: espacios.isSuccess && (espacioVisto === null || proyectos.isSuccess),
    fallo: espacios.isError || proyectos.isError,
    conMetodo: espacio === undefined || Boolean(espacio.metodo),
  }
}
