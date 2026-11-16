import { describe, expect, it } from 'vitest'
import { avisoDelMapa, type FallosDelMapa } from './avisos-del-mapa'
import {
  AVISO_GUARDAR_POSICIONES,
  AVISO_PLAN_NO_LEIDO,
  AVISO_VECINOS_NO_LEIDOS,
  SEPARADOR_DE_AVISOS,
} from './constants/api'

const NADA: FallosDelMapa = { guardar: false, vecinos: false, plan: false, ultimoCambio: false }

describe('avisoDelMapa', () => {
  it('sin fallos no hay aviso', () => {
    expect(avisoDelMapa(NADA)).toBeNull()
  })

  it('dice cada lectura que falló', () => {
    expect(avisoDelMapa({ ...NADA, vecinos: true })).toBe(AVISO_VECINOS_NO_LEIDOS)
    expect(avisoDelMapa({ ...NADA, plan: true })).toBe(AVISO_PLAN_NO_LEIDO)
  })

  it('junta varios en un solo texto, en orden', () => {
    expect(avisoDelMapa({ ...NADA, guardar: true, plan: true })).toBe(
      [AVISO_GUARDAR_POSICIONES, AVISO_PLAN_NO_LEIDO].join(SEPARADOR_DE_AVISOS),
    )
  })
})
