import { describe, expect, it } from 'vitest'
import { ANCHO_ETIQUETA, TAMANO_TEXTO, altoDeTexto } from './etiquetas'

describe('altoDeTexto — cuánto baja un texto, para poner otro debajo sin medirlo en el visor', () => {
  const unaLinea = TAMANO_TEXTO * 1.2

  it('24 letras en el ancho de una etiqueta son una línea; 25, dos (lo medido)', () => {
    expect(altoDeTexto('a'.repeat(24), TAMANO_TEXTO, ANCHO_ETIQUETA)).toBeCloseTo(unaLinea)
    expect(altoDeTexto('a'.repeat(25), TAMANO_TEXTO, ANCHO_ETIQUETA)).toBeCloseTo(2 * unaLinea)
  })

  it('un texto vacío igual ocupa una línea: nunca se monta lo de abajo encima', () => {
    expect(altoDeTexto('', TAMANO_TEXTO, ANCHO_ETIQUETA)).toBeCloseTo(unaLinea)
  })
})
