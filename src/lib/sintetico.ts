// Grafo falso pero con la forma del de Freddy (FASE 1, D5): ramas de color, personas y dudas que bloquean
// varias tareas, cadenas cortas de DEPENDE_DE. Determinista por semilla. En la FASE 4 lo reemplaza la API.

import { aleatorio, enteroAleatorio } from './aleatorio'
import {
  CANTIDAD_DUDAS,
  CANTIDAD_PERSONAS,
  COLORES_RAMA,
  PROBABILIDAD_BLOQUEADA_POR_DUDA,
  PROBABILIDAD_CERRADO,
  PROBABILIDAD_DEPENDE_DE,
  PROBABILIDAD_DOS_RAMAS,
  PROBABILIDAD_ESPERA_PERSONA,
  VENTANA_DEPENDENCIA,
} from './constants/grafo'
import { EstadoNodo, TipoConexion, TipoNodo, type Conexion, type Grafo, type Nodo } from './dominio'

export interface OpcionesGrafo {
  readonly nodos: number
  readonly semilla: number
}

/** Cada decisión aleatoria de una tarea usa su propio carril de la secuencia, para que no se pisen. */
const Carril = {
  ESTADO: 0,
  RAMA: 1,
  SEGUNDA_RAMA: 2,
  HAY_DEPENDENCIA: 3,
  DEPENDENCIA: 4,
  HAY_DUDA: 5,
  DUDA: 6,
  HAY_PERSONA: 7,
  PERSONA: 8,
  PERSONA_DE_DUDA: 9,
} as const
const CARRILES = Object.keys(Carril).length

function sorteo(semilla: number, indice: number, carril: number): number {
  return aleatorio(semilla, indice * CARRILES + carril)
}

function elegir(semilla: number, indice: number, carril: number, maximo: number): number {
  return enteroAleatorio(semilla, indice * CARRILES + carril, maximo)
}

function conexion(origenId: string, destinoId: string, tipo: TipoConexion): Conexion {
  return { id: `${tipo}:${origenId}->${destinoId}`, origenId, destinoId, tipo }
}

export function generarGrafo({ nodos, semilla }: OpcionesGrafo): Grafo {
  const ramas: Nodo[] = COLORES_RAMA.map((color, i) => ({
    id: `rama-${i}`,
    tipo: TipoNodo.RAMA,
    titulo: `Rama ${i + 1}`,
    estado: EstadoNodo.ABIERTO,
    color,
  }))
  const personas: Nodo[] = Array.from({ length: CANTIDAD_PERSONAS }, (_, i) => ({
    id: `persona-${i}`,
    tipo: TipoNodo.PERSONA,
    titulo: `Persona ${i + 1}`,
    estado: EstadoNodo.ABIERTO,
  }))
  const dudas: Nodo[] = Array.from({ length: CANTIDAD_DUDAS }, (_, i) => ({
    id: `duda-${i}`,
    tipo: TipoNodo.DUDA,
    titulo: `W${i + 1} · duda abierta`,
    estado: EstadoNodo.ABIERTO,
  }))

  const fijos = ramas.length + personas.length + dudas.length
  const cantidadTareas = Math.max(0, nodos - fijos)
  const tareas: Nodo[] = Array.from({ length: cantidadTareas }, (_, i) => {
    const cerrada = sorteo(semilla, i, Carril.ESTADO) < PROBABILIDAD_CERRADO
    return {
      id: `tarea-${i}`,
      tipo: TipoNodo.TAREA,
      titulo: `Tarea ${i + 1}`,
      estado: cerrada ? EstadoNodo.CERRADO : EstadoNodo.ABIERTO,
    }
  })

  const conexionesDeTarea = (tarea: Nodo, i: number): Conexion[] => {
    const rama = ramas[elegir(semilla, i, Carril.RAMA, ramas.length)]
    const segunda = ramas[elegir(semilla, i, Carril.SEGUNDA_RAMA, ramas.length)]
    const tieneDosRamas =
      sorteo(semilla, i, Carril.SEGUNDA_RAMA) < PROBABILIDAD_DOS_RAMAS && segunda.id !== rama.id
    const dependeDe = i > 0 && sorteo(semilla, i, Carril.HAY_DEPENDENCIA) < PROBABILIDAD_DEPENDE_DE
    const previa =
      tareas[i - 1 - elegir(semilla, i, Carril.DEPENDENCIA, Math.min(i, VENTANA_DEPENDENCIA))]
    const bloqueadaPorDuda = sorteo(semilla, i, Carril.HAY_DUDA) < PROBABILIDAD_BLOQUEADA_POR_DUDA
    const duda = dudas[elegir(semilla, i, Carril.DUDA, dudas.length)]
    const esperaPersona = sorteo(semilla, i, Carril.HAY_PERSONA) < PROBABILIDAD_ESPERA_PERSONA
    const persona = personas[elegir(semilla, i, Carril.PERSONA, personas.length)]

    return [
      conexion(tarea.id, rama.id, TipoConexion.PERTENECE_A),
      ...(tieneDosRamas ? [conexion(tarea.id, segunda.id, TipoConexion.PERTENECE_A)] : []),
      ...(dependeDe ? [conexion(tarea.id, previa.id, TipoConexion.DEPENDE_DE)] : []),
      ...(bloqueadaPorDuda ? [conexion(tarea.id, duda.id, TipoConexion.BLOQUEADA_POR)] : []),
      ...(esperaPersona ? [conexion(tarea.id, persona.id, TipoConexion.ESPERA_RESPUESTA_DE)] : []),
    ]
  }

  // Cada duda espera la respuesta de una persona: contestar libera todas las tareas que frena.
  const conexionesDeDudas = dudas.map((duda, i) => {
    const persona = personas[elegir(semilla, i, Carril.PERSONA_DE_DUDA, personas.length)]
    return conexion(duda.id, persona.id, TipoConexion.ESPERA_RESPUESTA_DE)
  })

  return {
    nodos: [...ramas, ...personas, ...dudas, ...tareas],
    conexiones: [...tareas.flatMap(conexionesDeTarea), ...conexionesDeDudas],
  }
}
