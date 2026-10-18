import { describe, expect, it } from 'vitest'
import { curvatura, esGestoDeMeta, esManoAbierta, esManoAlzada, esPoseDePelota } from './pose-mano'

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

describe('esManoAbierta — los dedos estirados, para dar vuelta la hoja (FASE 17)', () => {
  it('con los valores medidos en su mano: abierta sí; pelota y puño, no', () => {
    expect(esManoAbierta([0.0, 0.01, 0.0])).toBe(true)
    expect(esManoAbierta([0.26, 0.25, 0.27])).toBe(false)
    expect(esManoAbierta([0.68, 0.71, 0.72])).toBe(false)
  })

  it('si el visor perdió un dedo, no cuenta', () => {
    expect(esManoAbierta([0.0, Number.NaN, 0.01])).toBe(false)
    expect(esManoAbierta([])).toBe(false)
  })
})

describe('esManoAlzada — los gestos cuentan con la mano a la altura del hombro, no en reposo (Freddy, 2026-10-18)', () => {
  const OJOS = 1.6
  it('a la altura del hombro o más arriba, sí; el pecho, la falda o colgando, no', () => {
    expect(esManoAlzada(OJOS - 0.25, OJOS)).toBe(true)
    expect(esManoAlzada(OJOS + 0.1, OJOS)).toBe(true)
    // El pecho ya no alcanza: con la mano ahí, en reposo, se movía sola (Freddy, 2026-10-18).
    expect(esManoAlzada(OJOS - 0.45, OJOS)).toBe(false)
    expect(esManoAlzada(OJOS - 0.7, OJOS)).toBe(false)
    expect(esManoAlzada(OJOS - 0.9, OJOS)).toBe(false)
  })

  it('se mide desde la cabeza: sentado vale lo mismo que de pie', () => {
    const SENTADO = 1.2
    expect(esManoAlzada(SENTADO - 0.25, SENTADO)).toBe(true)
    expect(esManoAlzada(SENTADO - 0.7, SENTADO)).toBe(false)
  })
})

describe('esGestoDeMeta — el menú de Meta (palma hacia la cara + pellizco) no es un gesto nuestro (Freddy, 2026-10-18)', () => {
  // La mano derecha alzada 40 cm delante de los ojos (adelante es −z), los dedos hacia arriba.
  const ojos = { x: 0, y: 1.6, z: 0 }
  const muneca = { x: 0, y: 1.4, z: -0.4 }
  const junto = (dx: number, dy: number) => ({ x: muneca.x + dx, y: muneca.y + dy, z: muneca.z })
  // Con la palma hacia la cara, el pulgar —y la base del índice— quedan a la derecha (+x); hacia afuera, a la izquierda.
  const palmaHaciaLaCara = { baseIndice: junto(0.02, 0.05), baseMenique: junto(-0.02, 0.045) }
  const palmaHaciaAfuera = { baseIndice: junto(-0.02, 0.05), baseMenique: junto(0.02, 0.045) }
  const puntaIndice = junto(0, 0.17)
  const pellizco = { puntaIndice, puntaPulgar: { ...puntaIndice, x: puntaIndice.x + 0.01 } }
  const abierta = { puntaIndice, puntaPulgar: { ...puntaIndice, x: puntaIndice.x + 0.06 } }

  it('la palma hacia la cara con el pulgar en el índice: es el de Meta', () => {
    expect(esGestoDeMeta({ ojos, muneca, ...palmaHaciaLaCara, ...pellizco })).toBe(true)
  })

  it('el mismo pellizco con la palma hacia afuera —el 3, «OK», o el clic del rayo— no lo es', () => {
    expect(esGestoDeMeta({ ojos, muneca, ...palmaHaciaAfuera, ...pellizco })).toBe(false)
  })

  it('la palma hacia la cara sin pellizco tampoco: mirarse la mano no es un gesto', () => {
    expect(esGestoDeMeta({ ojos, muneca, ...palmaHaciaLaCara, ...abierta })).toBe(false)
  })
})
