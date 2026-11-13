// El alcance que se ve (FASE 24): la pestaña pedida contra lo que la API tiene. Sin espacio, «Todo» no espera nada y
// pide lo mismo que antes; con uno, se espera a saber si existe. Lo comparten el mapa y las barras.
import { useMemo } from 'react'
import { type ParamsDeAlcance, paramsDeAlcance, resolverAlcance } from '../lib/alcance'
import type { EspacioResponseDto, ProyectoResponseDto } from '../lib/api/generado/modelos'
import { useEspaciosControllerFindAll } from '../lib/api/generado/espacios/espacios'
import { useProyectosControllerListarDeEspacio } from '../lib/api/generado/proyectos/proyectos'
import { useEstadoVr } from '../lib/estado-vr'

const SIN_ID = ''

export interface AlcanceVr {
  readonly alcance: { readonly espacioId: string | null; readonly proyectoId: string | null }
  readonly aviso: string | null
  readonly params: ParamsDeAlcance
  readonly espacios: readonly EspacioResponseDto[] | undefined
  readonly proyectos: readonly ProyectoResponseDto[] | undefined
  readonly espacio: EspacioResponseDto | undefined
  readonly proyecto: ProyectoResponseDto | undefined
  /** `false` mientras hay un espacio pedido y todavía no se sabe si existe: no se pide nada con un id sin verificar. */
  readonly verificado: boolean
  readonly conMetodo: boolean
}

export function useAlcanceVr(): AlcanceVr {
  const espacioPedido = useEstadoVr((estado) => estado.espacioId)
  const proyectoPedido = useEstadoVr((estado) => estado.proyectoId)
  const espacios = useEspaciosControllerFindAll()
  const proyectos = useProyectosControllerListarDeEspacio(espacioPedido ?? SIN_ID, undefined, {
    query: { enabled: espacioPedido !== null },
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
    verificado: espacioPedido === null || espacios.isSuccess,
    conMetodo: espacio === undefined || Boolean(espacio.metodo),
  }
}
