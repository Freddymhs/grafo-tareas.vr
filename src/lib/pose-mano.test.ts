import { describe, expect, it } from 'vitest'
import { curvatura, esPoseDePelota } from './pose-mano'

const punto = (x: number, y: number) => ({ x, y, z: 0 })
/** Un dedo de 4 segmentos de 2 cm, doblado `grados` en cada articulación. */
function dedo(grados: number) {
  const paso = (grados * Math.PI) / 180
  return [0, 1, 2, 3, 4].reduce<{ x: number; y: number; z: number }[]>((puntos, i) => {
    if (i === 0) return [punto(0, 0)]
    const anterior = puntos[i - 1]
    const angulo = paso * (i - 1)
    return [
      ...puntos,
      punto(anterior.x + 0.02 * Math.cos(angulo), anterior.y + 0.02 * Math.sin(angulo)),
    ]
  }, [])
}

describe('curvatura — cuánto se dobla un dedo (FASE 15, la pose de la pelota)', () => {
  it('estirado ≈ 0; a medias, en el medio; cerrado, alto', () => {
    expect(curvatura(dedo(0))).toBeCloseTo(0, 6)
    const media = curvatura(dedo(30))
    const cerrado = curvatura(dedo(80))
    expect(media).toBeGreaterThan(0.05)
    expect(cerrado).toBeGreaterThan(media)
  })

  it('no depende del tamaño de la mano', () => {
    const grande = dedo(40).map(({ x, y, z }) => ({ x: x * 1.5, y: y * 1.5, z }))
    expect(curvatura(grande)).toBeCloseTo(curvatura(dedo(40)), 6)
  })
})

describe('esPoseDePelota — solo la mano como agarrando una pelota (Freddy, 2026-10-17)', () => {
  it('con los valores medidos en su mano: pelota sí; abierta y puño, no', () => {
    expect(esPoseDePelota([0.26, 0.25, 0.27])).toBe(true)
    expect(esPoseDePelota([0.41, 0.46, 0.44])).toBe(true)
    expect(esPoseDePelota([0.0, 0.01, 0.0])).toBe(false)
    expect(esPoseDePelota([0.68, 0.71, 0.72])).toBe(false)
  })

  it('si el visor perdió un dedo, no cuenta', () => {
    expect(esPoseDePelota([0.26, Number.NaN, 0.27])).toBe(false)
    expect(esPoseDePelota([])).toBe(false)
  })
})
