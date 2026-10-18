// Qué nodo es un PBI y si está entero (Freddy en el visor, 2026-10-18: [26750] «es un PBI… la única diferencia es que no
// tiene una fase», y se veía gris, perdido). Un PBI tiene dos mitades: su FASE, el documento, y su tarjeta `[<id>]`, la
// proyección del tablero (contrato de PORTAR.md). Las dos se ven moradas; la que no encuentra a la otra —una tarjeta
// sin FASE, que se trabaja sin haberla pensado; una FASE sin task, que se piensa sin PBI— se resalta. Se lee del
// título, como lo escriben el adaptador `tarjeta` y el importador de fases. Lo cerrado no está a medias: ya no es un
// riesgo, es historia. Puro.
import { EstadoNodo, Pbi, TipoNodo, type Nodo } from './dominio'

/** `[26750] …`, también con emojis delante (`🟣 [25682] …`). Una pieza del plan empieza con su ronda (`4️⃣`): no es tarjeta. */
const TASK_DE_TARJETA = /^[^\p{L}\p{N}[]*\[(\d+)\]/u
/** `FASE 30 · Sonar Tapon · 26317`: la task va al final; `FASE 36 · Husky Extras` todavía no tiene. */
const TASK_DE_FASE = / · (\d+)$/

type ConTitulo = Pick<Nodo, 'id' | 'tipo' | 'titulo' | 'estado'>

export function pbisDe(nodos: readonly ConTitulo[]): ReadonlyMap<string, Pbi> {
  const fases = nodos.filter(({ tipo }) => tipo === TipoNodo.FASE)
  const tasksConFase = new Set(
    fases.map(({ titulo }) => TASK_DE_FASE.exec(titulo)?.[1]).filter((task) => task !== undefined),
  )
  const pbiSegun = (encontroSuMitad: boolean, estado: EstadoNodo) =>
    encontroSuMitad || estado === EstadoNodo.CERRADO ? Pbi.ENTERO : Pbi.A_MEDIAS

  const pbis = new Map<string, Pbi>()
  fases.forEach(({ id, titulo, estado }) =>
    pbis.set(id, pbiSegun(TASK_DE_FASE.test(titulo), estado)),
  )
  nodos
    .filter(({ tipo }) => tipo === TipoNodo.TAREA)
    .forEach(({ id, titulo, estado }) => {
      const task = TASK_DE_TARJETA.exec(titulo)?.[1]
      if (task !== undefined) pbis.set(id, pbiSegun(tasksConFase.has(task), estado))
    })
  return pbis
}
