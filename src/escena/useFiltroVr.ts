// Los filtros del espacio que se ve y el que se aplica (FASE 26, D3). La regla vive en `filtrosDelEspacio`; un filtro
// puesto que este espacio no tiene no se aplica (`filtroVigente`). Lo consultan los dedos, el botón B, la leyenda y la escena.
import { type Filtro, filtroVigente, filtrosDelEspacio } from '../lib/filtro'
import { useEstadoVr } from '../lib/estado-vr'
import { useAlcanceVr } from './useAlcanceVr'

export interface FiltroVr {
  readonly filtros: readonly Filtro[]
  readonly filtro: Filtro
}

export function useFiltroVr(): FiltroVr {
  const { conMetodo, tipos } = useAlcanceVr()
  const puesto = useEstadoVr((estado) => estado.filtro)
  const filtros = filtrosDelEspacio(conMetodo, tipos ?? [])
  return { filtros, filtro: filtroVigente(puesto, filtros) }
}
