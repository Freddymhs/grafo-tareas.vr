// Qué nodo es un PBI y si está entero (Freddy en el visor, 2026-10-18: [26750] «es un PBI… la única diferencia es que no
// tiene una fase», y se veía gris, perdido). Un PBI tiene dos mitades: su FASE, el documento, y su tarjeta `[<id>]`, la
// proyección del tablero (contrato de PORTAR.md). Las dos se ven moradas; la que no encuentra a la otra —una tarjeta
// sin FASE, que se trabaja sin haberla pensado; una FASE sin task, que se piensa sin PBI— se resalta. La FASE sin task
// es además lo único que no está en Azure: va aparte, con borde (Freddy, 2026-10-19). Se lee del título, como lo
// escriben el adaptador `tarjeta` y el importador de fases. Lo cerrado no está a medias: ya no es un riesgo, es
// historia. Puro.
import { EstadoNodo, Pbi, TipoNodo, type Nodo } from './dominio'

/** Lo que se resalta (color y tamaño): el PBI al que le falta una mitad, esté o no en Azure. */
export const esPbiIncompleto = (pbi: Pbi | undefined) =>
  pbi === Pbi.A_MEDIAS || pbi === Pbi.SIN_TASK

/** `[26750] …`, también con emojis delante (`🟣 [25682] …`). Una pieza del plan empieza con su ronda (`4️⃣`): no es tarjeta. */
const TASK_DE_TARJETA = /^[^\p{L}\p{N}[]*\[(\d+)\]/u
/** `FASE 30 · Sonar Tapon · 26317`: la task va al final; `FASE 36 · Husky Extras` todavía no tiene. */
const TASK_DE_FASE = / · (\d+)$/

type ConTitulo = Pick<Nodo, 'id' | 'tipo' | 'titulo' | 'estado'>

/** La task de la que es mitad: la tarjeta `[<id>]` o la FASE `… · <id>`; lo demás no tiene. */
export function taskDe({ tipo, titulo }: Pick<Nodo, 'tipo' | 'titulo'>): string | undefined {
  if (tipo === TipoNodo.FASE) return TASK_DE_FASE.exec(titulo)?.[1]
  if (tipo === TipoNodo.TAREA) return TASK_DE_TARJETA.exec(titulo)?.[1]
  return undefined
}

export function pbisDe(nodos: readonly ConTitulo[]): ReadonlyMap<string, Pbi> {
  const fases = nodos.filter(({ tipo }) => tipo === TipoNodo.FASE)
  const tasksConFase = new Set(
    fases.map(({ titulo }) => TASK_DE_FASE.exec(titulo)?.[1]).filter((task) => task !== undefined),
  )
  const pbiSegun = (encontroSuMitad: boolean, estado: EstadoNodo) =>
    encontroSuMitad || estado === EstadoNodo.CERRADO ? Pbi.ENTERO : Pbi.A_MEDIAS
  const faseSegun = (tieneTask: boolean, estado: EstadoNodo) =>
    tieneTask || estado === EstadoNodo.CERRADO ? Pbi.ENTERO : Pbi.SIN_TASK

  const pbis = new Map<string, Pbi>()
  fases.forEach(({ id, titulo, estado }) =>
    pbis.set(id, faseSegun(TASK_DE_FASE.test(titulo), estado)),
  )
  nodos
    .filter(({ tipo }) => tipo === TipoNodo.TAREA)
    .forEach(({ id, titulo, estado }) => {
      const task = TASK_DE_TARJETA.exec(titulo)?.[1]
      if (task !== undefined) pbis.set(id, pbiSegun(tasksConFase.has(task), estado))
    })
  return pbis
}
