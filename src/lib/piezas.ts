// Las piezas del plan que todavía no tienen task en el tracker: candidatas a PBI. La leyenda de la cara plan las cuenta,
// para que se lean como lo que falta construir y no como una fase (Freddy en el visor, 2026-10-19: «veo solo una fase»).
// Puro.

import { EstadoNodo, TipoNodo, type Nodo } from './dominio'

export function contarPiezasSinTask(
  nodos: readonly Pick<Nodo, 'tipo' | 'estado' | 'porCrear'>[],
): number {
  return nodos.filter(
    ({ tipo, estado, porCrear }) =>
      tipo === TipoNodo.TAREA && estado === EstadoNodo.ABIERTO && porCrear === true,
  ).length
}

/** La línea de la leyenda; sin piezas por crear, ninguna. */
export function textoDePiezas(cuantas: number): string | null {
  const sinPiezas = cuantas === 0
  if (sinPiezas) return null
  return `piezas sin task (candidatas a PBI): ${cuantas}`
}
