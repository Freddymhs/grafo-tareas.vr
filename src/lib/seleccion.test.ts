import { describe, expect, it } from 'vitest'
import { resumenDeEspera } from './seleccion'

describe('resumenDeEspera — qué dice la selección sobre lo que la frena (FASE 15)', () => {
  it('una sola cosa: su nombre, que sí sirve leer', () => {
    expect(resumenDeEspera(['¿qué preguntas?'])).toBe('Espera a: ¿qué preguntas?')
  })

  it('varias: solo cuántas, porque se iluminan alrededor (la lista larga tapaba la vista)', () => {
    const diecisiete = Array.from(
      { length: 17 },
      (_, i) => `[2593${i}] FASE ${i} · falta URL commit`,
    )
    expect(resumenDeEspera(diecisiete)).toBe('Espera a 17 — se iluminan alrededor')
  })

  it('nada: libre', () => {
    expect(resumenDeEspera([])).toBe('Libre: nada lo frena')
  })
})
