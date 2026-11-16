// Las lecturas que no tumban el mapa pero que, si fallan, dejan algo sin mostrar: se dicen en un solo aviso. Puro.
import {
  AVISO_GUARDAR_POSICIONES,
  AVISO_PLAN_NO_LEIDO,
  AVISO_ULTIMO_CAMBIO_NO_LEIDO,
  AVISO_VECINOS_NO_LEIDOS,
  SEPARADOR_DE_AVISOS,
} from './constants/api'

export interface FallosDelMapa {
  readonly guardar: boolean
  readonly vecinos: boolean
  readonly plan: boolean
  readonly ultimoCambio: boolean
}

/** Un solo texto con lo que falló; `null` si no falló nada. */
export function avisoDelMapa({
  guardar,
  vecinos,
  plan,
  ultimoCambio,
}: FallosDelMapa): string | null {
  const avisos = [
    guardar ? AVISO_GUARDAR_POSICIONES : null,
    vecinos ? AVISO_VECINOS_NO_LEIDOS : null,
    plan ? AVISO_PLAN_NO_LEIDO : null,
    ultimoCambio ? AVISO_ULTIMO_CAMBIO_NO_LEIDO : null,
  ].filter((aviso) => aviso !== null)
  return avisos.length > 0 ? avisos.join(SEPARADOR_DE_AVISOS) : null
}
