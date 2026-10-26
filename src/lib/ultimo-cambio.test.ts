import { describe, expect, it } from 'vitest'
import { textoDelUltimoCambio } from './ultimo-cambio'

describe('textoDelUltimoCambio — lo último que cambió en la página, escrito para leer de un vistazo', () => {
  it('la hora, el nombre de hoy (sin emojis) y lo que pasó', () => {
    const texto = textoDelUltimoCambio(
      { nodoId: 'x', cuando: '2026-10-26T23:24:08Z', que: 'pasó a Trabajo' },
      '[26958] Revisión - iniciar y cancelar 🟢',
    )
    expect(texto).toMatch(/^último cambio · \d{2}:\d{2}/)
    expect(texto.endsWith('[26958] Revisión - iniciar y cancelar pasó a Trabajo')).toBe(true)
  })
})
