import { describe, expect, it } from 'vitest'
import { LARGO_ETIQUETA, textoVisible } from './texto-visible'

describe('textoVisible', () => {
  it('saca los emojis que la fuente 3D dibuja como cajas, sin perder el número de la tecla', () => {
    expect(textoVisible('2️⃣ 🔵🟢 [25327] Bloqueo sin Unidad', 100)).toBe(
      '2 [25327] Bloqueo sin Unidad',
    )
    expect(textoVisible('AMARRAR 🧰', 100)).toBe('AMARRAR')
  })

  it('acorta lo largo con «…» y deja lo corto igual', () => {
    const largo = 'a'.repeat(200)
    const visto = textoVisible(largo, LARGO_ETIQUETA)
    expect(visto).toHaveLength(LARGO_ETIQUETA)
    expect(visto.endsWith('…')).toBe(true)
    expect(textoVisible('FASE 32', LARGO_ETIQUETA)).toBe('FASE 32')
  })

  it('respeta los acentos y la ñ', () => {
    expect(textoVisible('¿Qué es un "análisis opcional"? Ñandú', 100)).toBe(
      '¿Qué es un "análisis opcional"? Ñandú',
    )
  })
})
