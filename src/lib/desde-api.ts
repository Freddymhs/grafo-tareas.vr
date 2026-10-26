// Baja las respuestas de la API (tipos de Orval) al modelo que dibuja la escena. Puro.
import type { ConexionResponseDto, NodoResponseDto } from './api/generado/modelos'
import {
  ETIQUETA_ESPERA,
  ETIQUETA_MERGEADA,
  ETIQUETA_POR_CREAR,
  ETIQUETA_TRAMITE,
} from './constants/grafo'
import type { Grafo, Posicion } from './dominio'
import { pbisDe } from './pbi'

export function aGrafo(
  nodos: readonly NodoResponseDto[],
  conexiones: readonly ConexionResponseDto[],
): Grafo {
  const ids = new Set(nodos.map(({ id }) => id))
  // Sobre todos los nodos, no sobre una página: la FASE de una tarjeta puede estar en otra.
  const pbis = pbisDe(nodos)
  return {
    nodos: nodos.map(({ id, tipo, titulo, estado, color, fechaOrigen, etiquetas, cara }) => {
      const mergeada = (etiquetas ?? []).includes(ETIQUETA_MERGEADA)
      const tramite = (etiquetas ?? []).includes(ETIQUETA_TRAMITE)
      const porCrear = (etiquetas ?? []).includes(ETIQUETA_POR_CREAR)
      const espera = (etiquetas ?? []).includes(ETIQUETA_ESPERA)
      const pbi = pbis.get(id)
      return {
        id,
        tipo,
        titulo,
        estado,
        ...(color ? { color } : {}),
        fecha: fechaOrigen,
        ...(mergeada ? { mergeada } : {}),
        ...(tramite ? { tramite } : {}),
        ...(pbi ? { pbi } : {}),
        ...(porCrear ? { porCrear } : {}),
        ...(espera ? { espera } : {}),
        cara,
      }
    }),
    // Una conexión hacia un nodo que no vino (otra página, o borrado entre las dos lecturas) no se dibuja.
    conexiones: conexiones
      .filter(({ origenId, destinoId }) => ids.has(origenId) && ids.has(destinoId))
      .map(({ id, origenId, destinoId, tipo }) => ({ id, origenId, destinoId, tipo })),
  }
}

/** Las posiciones que la API ya tiene guardadas (las tres coordenadas, o ninguna). */
export function posicionesGuardadas(
  nodos: readonly NodoResponseDto[],
): ReadonlyMap<string, Posicion> {
  const guardadas = new Map<string, Posicion>()
  nodos.forEach(({ id, posX, posY, posZ }) => {
    const completa = posX != null && posY != null && posZ != null
    if (completa) guardadas.set(id, { x: posX, y: posY, z: posZ })
  })
  return guardadas
}
