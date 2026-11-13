// Baja las respuestas de la API (tipos de Orval) al modelo que dibuja la escena. Puro.
import type { ConexionResponseDto, NodoResponseDto } from './api/generado/modelos'
import {
  ETIQUETA_ESPERA,
  ETIQUETA_MERGEADA,
  ETIQUETA_POR_CREAR,
  ETIQUETA_TRAMITE,
} from './constants/grafo'
import { EstadoNodo, type Grafo, type Posicion } from './dominio'
import { pbisDe } from './pbi'

// Un tipo sin ciclo (Mis máquinas) llega sin estado: se dibuja como abierto.
const comoEstado = (estado: EstadoNodo | null): EstadoNodo => estado ?? EstadoNodo.ABIERTO

/**
 * Los vecinos (FASE 24) son nodos de otros proyectos conectados con algo de la vista: entran como fantasmas, con el
 * rótulo de su proyecto, y así sus conexiones dejan de filtrarse. Uno que ya vino entre los nodos no se duplica.
 */
export function aGrafo(
  nodosPropios: readonly NodoResponseDto[],
  conexiones: readonly ConexionResponseDto[],
  vecinos: readonly NodoResponseDto[] = [],
  rotulo: (proyectoId: string) => string = () => '',
): Grafo {
  const idsPropios = new Set(nodosPropios.map(({ id }) => id))
  const fantasmas = vecinos.filter(({ id }) => !idsPropios.has(id))
  const nodos = [...nodosPropios, ...fantasmas]
  const ids = new Set(nodos.map(({ id }) => id))
  const rotuloDeFantasma = new Map(fantasmas.map(({ id, proyectoId }) => [id, rotulo(proyectoId)]))
  // Sobre todos los nodos, no sobre una página: la FASE de una tarjeta puede estar en otra.
  const pbis = pbisDe(
    nodos.map(({ id, tipo, titulo, estado }) => ({
      id,
      tipo,
      titulo,
      estado: comoEstado(estado),
    })),
  )
  return {
    nodos: nodos.map(
      ({ id, tipo, titulo, estado, color, fechaOrigen, etiquetas, resumen, proyectoId }) => {
        const mergeada = (etiquetas ?? []).includes(ETIQUETA_MERGEADA)
        const tramite = (etiquetas ?? []).includes(ETIQUETA_TRAMITE)
        const porCrear = (etiquetas ?? []).includes(ETIQUETA_POR_CREAR)
        const espera = (etiquetas ?? []).includes(ETIQUETA_ESPERA)
        const pbi = pbis.get(id)
        const fantasma = rotuloDeFantasma.get(id)
        return {
          id,
          tipo,
          titulo,
          estado: comoEstado(estado),
          ...(color ? { color } : {}),
          fecha: fechaOrigen,
          ...(mergeada ? { mergeada } : {}),
          ...(tramite ? { tramite } : {}),
          ...(pbi ? { pbi } : {}),
          ...(porCrear ? { porCrear } : {}),
          ...(espera ? { espera } : {}),
          ...(resumen ? { resumen } : {}),
          ...(proyectoId ? { proyectoId } : {}),
          ...(fantasma ? { fantasma } : {}),
        }
      },
    ),
    // Una conexión hacia un nodo que no vino (otra página, o borrado entre las dos lecturas) no se dibuja.
    conexiones: conexiones
      .filter(({ origenId, destinoId }) => ids.has(origenId) && ids.has(destinoId))
      .map(({ id, origenId, destinoId, tipo }) => ({
        id,
        origenId,
        destinoId,
        tipo,
      })),
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
