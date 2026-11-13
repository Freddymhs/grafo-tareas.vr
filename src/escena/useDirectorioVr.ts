// Todos los proyectos de todos los espacios, también los archivados (FASE 24, D8): lo que hace falta para rotular un
// fantasma con el nombre de su proyecto y su espacio.
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useEspaciosControllerFindAll } from '../lib/api/generado/espacios/espacios'
import { getProyectosControllerListarDeEspacioQueryOptions } from '../lib/api/generado/proyectos/proyectos'
import type { ProyectoResponseDto } from '../lib/api/generado/modelos'
import { type Directorio, armarDirectorio } from '../lib/directorio'

const CON_ARCHIVADOS = { archivados: true }
const soloLosDatos = (resultados: readonly { data: ProyectoResponseDto[] | undefined }[]) =>
  resultados.map(({ data }) => data)

export function useDirectorioVr(): Directorio {
  const espacios = useEspaciosControllerFindAll(CON_ARCHIVADOS)
  const listaDeEspacios = useMemo(() => espacios.data ?? [], [espacios.data])
  const listas = useQueries({
    queries: listaDeEspacios.map(({ id }) =>
      getProyectosControllerListarDeEspacioQueryOptions(id, CON_ARCHIVADOS),
    ),
    combine: soloLosDatos,
  })
  return useMemo(() => {
    const porEspacio: Record<string, ProyectoResponseDto[]> = {}
    listaDeEspacios.forEach(({ id }, posicion) => {
      porEspacio[id] = listas[posicion] ?? []
    })
    return armarDirectorio(listaDeEspacios, porEspacio)
  }, [listaDeEspacios, listas])
}
