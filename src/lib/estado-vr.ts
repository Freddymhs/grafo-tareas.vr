// El estado de la app VR (FASE 7, tarea 3): qué está seleccionado, si se está conectando y qué se resalta.
// Zustand por la practice-wishlist; el estado del SERVIDOR sigue en TanStack Query, acá solo lo de la escena.
import { create } from 'zustand'
import { TipoConexion } from './dominio'
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
  /** La página que se ve (FASE 15): el índice en `GET /derivado/paginas`. */
  readonly pagina: number
  /** El nodo bajo el rayo, sin tocarlo (FASE 15): su texto se amplía. */
  readonly apuntado: string | null
  tocar: (id: string) => Toque
  empezarConexion: (conexion: ConexionDesdeVr) => void
  cancelar: () => void
  resaltar: (ids: readonly string[]) => void
  avisar: (aviso: string | null) => void
  /** X / Y del control izquierdo, o girar la pelota: la siguiente o la anterior, dando la vuelta. */
  cambiarPagina: (paso: 1 | -1, total: number) => void
  irAPagina: (indice: number) => void
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
  pagina: 0,
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
  // Lo seleccionado puede no existir en la otra página (regla §7): se suelta al cambiar.
  cambiarPagina: (paso, total) =>
    set({ pagina: paginaVecina(get().pagina, paso, total), ...SIN_SELECCION }),
  irAPagina: (indice) => set({ pagina: indice, ...SIN_SELECCION }),
  apuntar: (id) => set({ apuntado: id }),
}))
