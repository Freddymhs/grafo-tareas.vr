// Lo que no está en Azure se ve de un vistazo: la FASE sin task lleva un borde delgado alrededor de su esfera (Freddy,
// 2026-10-19: «un borde delgado, pero que se nota»). La tarjeta sin FASE no lo lleva: esa sí está en Azure. Un filtro
// que apaga la FASE le apaga también el borde. Puro.
import { Pbi, type Nodo } from './dominio'

export function idsConBorde(
  nodos: readonly Pick<Nodo, 'id' | 'pbi'>[],
  iluminados: ReadonlySet<string> | null,
): ReadonlySet<string> {
  const sinTask = nodos.filter(({ pbi }) => pbi === Pbi.SIN_TASK).map(({ id }) => id)
  const visibles = iluminados === null ? sinTask : sinTask.filter((id) => iluminados.has(id))
  return new Set(visibles)
}
