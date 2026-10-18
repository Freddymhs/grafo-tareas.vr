// Lo que la selección dice sobre lo que frena a un nodo (FASE 15). La API dice qué lo bloquea (`GET /nodos/:id/bloqueado`);
// acá solo se decide cómo leerlo. Con varias cosas, la lista entera (17 subtareas en rojo) tapaba la vista y repetía lo
// que el grafo ya muestra: al seleccionar, la familia se ilumina alrededor. A una persona la pregunta es al revés —quién
// la espera, no qué la frena— (Freddy en el visor, 2026-10-18: «Libre: nada lo frena… no tengo idea qué es esto»). Puro.
import { EstadoNodo, Pbi, TipoConexion, TipoNodo, type Grafo, type Nodo } from './dominio'
import { LARGO_ETIQUETA, textoVisible } from './texto-visible'

export function resumenDeEspera(titulos: readonly string[]): string {
  if (titulos.length === 0) return 'Libre: nada lo frena'
  if (titulos.length === 1) return `Espera a: ${textoVisible(titulos[0] ?? '', LARGO_ETIQUETA)}`
  return `Espera a ${titulos.length} — se iluminan alrededor`
}

/** Los títulos de lo abierto que espera respuesta de esta persona (lo cerrado ya no la espera). */
export function quienesEsperan(personaId: string, { nodos, conexiones }: Grafo): readonly string[] {
  const abiertos = new Map(
    nodos
      .filter(({ estado }) => estado === EstadoNodo.ABIERTO)
      .map(({ id, titulo }) => [id, titulo]),
  )
  return conexiones
    .filter(
      ({ tipo, destinoId }) => tipo === TipoConexion.ESPERA_RESPUESTA_DE && destinoId === personaId,
    )
    .map(({ origenId }) => abiertos.get(origenId))
    .filter((titulo) => titulo !== undefined)
}

export function resumenDeQuienEspera(titulos: readonly string[]): string {
  if (titulos.length === 0) return 'Nadie la espera'
  if (titulos.length === 1) return `La espera: ${textoVisible(titulos[0] ?? '', LARGO_ETIQUETA)}`
  return `La esperan ${titulos.length} — se iluminan alrededor`
}

/** Qué mitad le falta a un PBI a medias (`lib/pbi.ts`); `null` si no es uno. */
export function avisoDePbi({ pbi, tipo }: Pick<Nodo, 'pbi' | 'tipo'>): string | null {
  if (pbi !== Pbi.A_MEDIAS) return null
  return tipo === TipoNodo.FASE ? 'PBI a medias: FASE sin task' : 'PBI a medias: sin FASE'
}
