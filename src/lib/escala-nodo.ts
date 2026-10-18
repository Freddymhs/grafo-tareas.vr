// Cuánto crece la esfera de cada nodo, por tipo, estado y selección. Puro.
import { EstadoNodo, TipoNodo, type Nodo } from './dominio'

const ESCALA_CERRADO = 0.5
const ESCALA_BLOQUEANTE = 1.8
const ESCALA_SELECCIONADO = 2.2
/** Lo que se liberó al cerrar (FASE 7): más grande, para que se vea qué destrabó. */
const ESCALA_RESALTADO = 1.9
const BLOQUEANTES: ReadonlySet<string> = new Set([TipoNodo.PERSONA, TipoNodo.DUDA, TipoNodo.RAMA])
/** El esqueleto del árbol (FASE 13): la HU es el centro de su racimo; la FASE, un nudo entre la HU y sus tarjetas. */
const ESCALA_HISTORIA = 3.2
const ESCALA_FASE = 1.5

export function escalaDe(
  nodo: Nodo,
  seleccionado: string | null,
  resaltados: ReadonlySet<string>,
): number {
  if (nodo.id === seleccionado) return ESCALA_SELECCIONADO
  if (resaltados.has(nodo.id)) return ESCALA_RESALTADO
  if (nodo.tipo === TipoNodo.HISTORIA) return ESCALA_HISTORIA
  if (nodo.tipo === TipoNodo.FASE) return ESCALA_FASE
  if (BLOQUEANTES.has(nodo.tipo)) return ESCALA_BLOQUEANTE
  return nodo.estado === EstadoNodo.CERRADO ? ESCALA_CERRADO : 1
}
