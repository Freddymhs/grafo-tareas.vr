// El estado de la app VR (FASE 7, tarea 3): qué está seleccionado, si se está conectando y qué se resalta.
// Zustand por la practice-wishlist; el estado del SERVIDOR sigue en TanStack Query, acá solo lo de la escena.
import { create } from 'zustand'
import { Cara, TipoConexion } from './dominio'
import { Filtro, siguienteFiltro } from './filtro'
import { paginaVecina } from './paginas'

/** Las conexiones que se crean apuntando: las que frenan trabajo. PERTENECE_A y EN_DAILY_DE se hacen en la PWA. */
export const CONEXIONES_DESDE_VR = [
  TipoConexion.DEPENDE_DE,
  TipoConexion.BLOQUEADA_POR,
  TipoConexion.ESPERA_RESPUESTA_DE,
] as const
export type ConexionDesdeVr = (typeof CONEXIONES_DESDE_VR)[number]

export type Modo =
  | { readonly tipo: 'normal' }
  | { readonly tipo: 'conectando'; readonly origenId: string; readonly conexion: ConexionDesdeVr }

/** Lo que pide un toque sobre un nodo: la escena lo ejecuta (seleccionar es local; conectar va a la API). */
export type Toque =
  | { readonly accion: 'seleccionar'; readonly id: string }
  | { readonly accion: 'deseleccionar' }
  | {
      readonly accion: 'conectar'
      readonly origenId: string
      readonly destinoId: string
      readonly conexion: ConexionDesdeVr
    }

interface EstadoVr {
  readonly seleccionado: string | null
  readonly modo: Modo
  /** Lo que se liberó al cerrar el último nodo (`GET /nodos/:id/libera`). */
  readonly resaltados: ReadonlySet<string>
  readonly aviso: string | null
  /** La HU que se ve (FASE 15): el índice de su libro entre los de `GET /derivado/paginas` (`librosDe`). */
  readonly libro: number
  /** Qué cara del libro (FASE 17): lo real o el plan. */
  readonly cara: Cara
  /** El lente de la página (FASE 17): todo, o lo pendiente con lo resuelto apagado. Sigue al cambiar de HU. */
  readonly filtro: Filtro
  /** El nodo bajo el rayo, sin tocarlo (FASE 15): su texto se amplía. */
  readonly apuntado: string | null
  tocar: (id: string) => Toque
  empezarConexion: (conexion: ConexionDesdeVr) => void
  cancelar: () => void
  resaltar: (ids: readonly string[]) => void
  avisar: (aviso: string | null) => void
  /** X / Y del control izquierdo, o girar la pelota: la HU siguiente o la anterior, dando la vuelta. Cae en lo real. */
  cambiarLibro: (paso: 1 | -1, total: number) => void
  irALibro: (indice: number) => void
  /** Dar vuelta la hoja (FASE 17): la otra cara del mismo libro (`otraCara`). */
  verCara: (cara: Cara) => void
  /** Los dedos de la mano derecha (`filtroAlMostrar`). */
  verFiltro: (filtro: Filtro) => void
  /** El botón B del control derecho: el filtro siguiente, dando la vuelta (`siguienteFiltro`). */
  alternarFiltro: () => void
  apuntar: (id: string | null) => void
}

const NORMAL: Modo = { tipo: 'normal' }
const NADA: ReadonlySet<string> = new Set()
const SIN_SELECCION = {
  seleccionado: null,
  apuntado: null,
  modo: NORMAL,
  resaltados: NADA,
  aviso: null,
} as const

/** La regla de un toque, pura: conectando → el tocado es el destino; si no, alterna la selección. */
export function decidirToque(estado: Pick<EstadoVr, 'seleccionado' | 'modo'>, id: string): Toque {
  const { modo, seleccionado } = estado
  if (modo.tipo === 'conectando' && id !== modo.origenId) {
    return { accion: 'conectar', origenId: modo.origenId, destinoId: id, conexion: modo.conexion }
  }
  if (modo.tipo === 'conectando') return { accion: 'seleccionar', id }
  return seleccionado === id ? { accion: 'deseleccionar' } : { accion: 'seleccionar', id }
}

export const useEstadoVr = create<EstadoVr>()((set, get) => ({
  seleccionado: null,
  modo: NORMAL,
  resaltados: NADA,
  aviso: null,
  libro: 0,
  cara: Cara.REAL,
  filtro: Filtro.TODO,
  apuntado: null,
  tocar: (id) => {
    const toque = decidirToque(get(), id)
    if (toque.accion === 'conectar')
      set({ modo: NORMAL, seleccionado: toque.origenId, aviso: null })
    if (toque.accion === 'seleccionar') set({ seleccionado: toque.id, modo: NORMAL, aviso: null })
    if (toque.accion === 'deseleccionar') set({ seleccionado: null, resaltados: NADA, aviso: null })
    return toque
  },
  empezarConexion: (conexion) => {
    const { seleccionado } = get()
    if (seleccionado)
      set({ modo: { tipo: 'conectando', origenId: seleccionado, conexion }, aviso: null })
  },
  cancelar: () => set({ modo: NORMAL, aviso: null }),
  resaltar: (ids) => set({ resaltados: new Set(ids) }),
  avisar: (aviso) => set({ aviso }),
  // Lo seleccionado puede no existir en la otra página (regla §7): se suelta al cambiar de HU o de cara.
  // «TRABAJO va primero»: otra HU se abre siempre en lo real.
  cambiarLibro: (paso, total) =>
    set({ libro: paginaVecina(get().libro, paso, total), cara: Cara.REAL, ...SIN_SELECCION }),
  irALibro: (indice) => set({ libro: indice, cara: Cara.REAL, ...SIN_SELECCION }),
  verCara: (cara) => set({ cara, ...SIN_SELECCION }),
  verFiltro: (filtro) => set({ filtro }),
  alternarFiltro: () => set({ filtro: siguienteFiltro(get().filtro) }),
  apuntar: (id) => set({ apuntado: id }),
}))
