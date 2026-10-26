import { describe, expect, it } from 'vitest'
import { centrarEn } from './centrar'
import { anguloDe, enCilindro } from './layout'

const GRADO = Math.PI / 180
const RADIO = 3

describe('centrarEn — la página arranca con su HU al frente', () => {
  // La HU 24576 del 26-10: guardada a −70,5°; sus tarjetas, alrededor de −20°.
  const posiciones = new Map([
    ['hu', enCilindro(-70.5 * GRADO, 1.24, RADIO)],
    ['tarjeta', enCilindro(-22 * GRADO, 1.59, RADIO)],
  ])

  it('la HU queda al frente (ángulo 0) y lo demás conserva su distancia a ella', () => {
    const centradas = centrarEn(posiciones, 'hu')
    const hu = centradas.get('hu')
    const tarjeta = centradas.get('tarjeta')
    expect(hu && anguloDe(hu)).toBeCloseTo(0)
    expect(tarjeta && anguloDe(tarjeta) / GRADO).toBeCloseTo(48.5)
  })

  it('no cambia ni la altura ni el radio: solo gira', () => {
    const tarjeta = centrarEn(posiciones, 'hu').get('tarjeta')
    expect(tarjeta?.y).toBe(1.59)
    expect(tarjeta && Math.hypot(tarjeta.x, tarjeta.z)).toBeCloseTo(RADIO)
  })

  it('sin HU en la página («Sin HU») la deja como está', () => {
    expect(centrarEn(posiciones, null)).toBe(posiciones)
    expect(centrarEn(posiciones, 'otra')).toBe(posiciones)
  })
})
