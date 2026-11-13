// Lo que dice la leyenda de la barra superior: qué significa cada pelota. En un espacio con método la arma
// `BarraSuperior` (HU, PBI, dudas…); fuera del método, la de sus tipos (FASE 26, D3). Puro.
import type { TipoNodoResponseDto } from './api/generado/modelos'
import { colorDeTipo } from './colores'
import { COLOR_SIN_RAMA } from './constants/grafo'

export interface ItemLeyenda {
  readonly color: string | null
  readonly texto: string
  readonly escala?: number
}

const ESCALA_CERRADA = 0.5
export const CERRADA: ItemLeyenda = {
  color: COLOR_SIN_RAMA,
  texto: 'chica = cerrada',
  escala: ESCALA_CERRADA,
}

/** Un ítem por tipo, en el orden de `GET /espacios/:id/tipos-nodo`; «chica = cerrada» solo si algún tipo tiene ciclo. */
export function leyendaDeTipos(
  tipos: readonly Pick<TipoNodoResponseDto, 'nombre' | 'color' | 'tieneCiclo'>[],
): readonly ItemLeyenda[] {
  const items = tipos.map((tipo) => ({ color: colorDeTipo(tipo), texto: tipo.nombre }))
  const conCiclo = tipos.some(({ tieneCiclo }) => tieneCiclo)
  return conCiclo ? [...items, CERRADA] : items
}
