import { Quaternion, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { giroVertical } from './giro-vertical'

const ARRIBA = new Vector3(0, 1, 0)
const ADELANTE = new Vector3(1, 0, 0)
const giro = (eje: Vector3, grados: number) =>
  new Quaternion().setFromAxisAngle(eje, (grados * Math.PI) / 180)
const enGrados = (rad: number) => (rad * 180) / Math.PI

describe('giroVertical — cuánto giró la mano alrededor del eje vertical', () => {
  it('girar a la derecha es positivo; a la izquierda, negativo', () => {
    const quieta = new Quaternion()
    expect(enGrados(giroVertical(quieta, giro(ARRIBA, -30)))).toBeCloseTo(30, 5)
    expect(enGrados(giroVertical(quieta, giro(ARRIBA, 30)))).toBeCloseTo(-30, 5)
  })

  it('no depende de la pose: con la mano vertical (inclinada 90°) mide el mismo giro', () => {
    const vertical = giro(ADELANTE, 90)
    const girada = giro(ARRIBA, -40).multiply(vertical)
    expect(enGrados(giroVertical(vertical, girada))).toBeCloseTo(40, 5)
  })

  it('inclinar la mano sin girarla no cuenta', () => {
    expect(giroVertical(new Quaternion(), giro(ADELANTE, 60))).toBeCloseTo(0, 6)
  })
})
