// Qué bloquea a un nodo. SOLO para la FASE 1, con datos sintéticos: desde la FASE 4 lo calcula la API
// (`GET /nodos/:id/bloqueado`, decisión C1) y este archivo se borra.

import { CONEXIONES_BLOQUEANTES, EstadoNodo, type Grafo, type Nodo } from './dominio'

export function bloqueadoPor(grafo: Grafo, nodoId: string): readonly Nodo[] {
  const porId = new Map(grafo.nodos.map((nodo) => [nodo.id, nodo]))
  const destinos = grafo.conexiones
    .filter((c) => c.origenId === nodoId && CONEXIONES_BLOQUEANTES.has(c.tipo))
    .map((c) => porId.get(c.destinoId))
  return destinos.filter(
    (nodo): nodo is Nodo => nodo !== undefined && nodo.estado === EstadoNodo.ABIERTO,
  )
}
