import { describe, expect, it } from 'vitest'
import {
  ENFRIAMIENTO_S,
  UMBRAL_SUBIDA_M,
  VENTANA_S,
  VOLTEAR_INICIAL,
  avanzarVoltear,
  type EstadoVoltear,
  type MuestraVoltear,
} from './gesto-voltear'

/** Pasa una serie de muestras por el detector y junta los eventos. */
function recorrer(muestras: readonly MuestraVoltear[], inicial: EstadoVoltear = VOLTEAR_INICIAL) {
  return muestras.reduce(
    ({ estado, eventos }, muestra) => {
      const paso = avanzarVoltear(estado, muestra)
      return { estado: paso.estado, eventos: paso.evento ? [...eventos, paso.evento] : eventos }
    },
    { estado: inicial, eventos: [] as string[] },
  )
}

/** Un movimiento vertical de `metros` (negativo = bajar) en `segundos`, muestreado a 30 Hz. */
function movimiento(metros: number, segundos: number, desde = 1, inicio = 0): MuestraVoltear[] {
  const pasos = Math.round(segundos * 30)
  return Array.from({ length: pasos + 1 }, (_, i) => ({
    t: inicio + (segundos * i) / pasos,
    altura: desde + (metros * i) / pasos,
    abierta: true,
    alzada: true,
  }))
}

describe('avanzarVoltear — la mano abierta que sube rápido da vuelta la hoja (FASE 17)', () => {
  it('una subida rápida da vuelta la hoja', () => {
    expect(recorrer(movimiento(0.3, 0.3)).eventos).toEqual(['voltear'])
  })

  it('una subida lenta no cuenta: es mover la mano, no el gesto', () => {
    expect(recorrer(movimiento(0.3, 4 * VENTANA_S)).eventos).toEqual([])
  })

  it('bajar la mano nunca cuenta: es descansarla', () => {
    expect(recorrer(movimiento(-0.3, 0.3)).eventos).toEqual([])
  })

  it('con la mano abajo (bajo el hombro) la subida no cuenta, como los otros gestos', () => {
    const abajo = movimiento(0.3, 0.3).map((m) => ({ ...m, alzada: false }))
    expect(recorrer(abajo).eventos).toEqual([])
  })

  it('sin la mano abierta (pelota o puño) la subida no cuenta', () => {
    const cerrada = movimiento(0.3, 0.3).map((m) => ({ ...m, abierta: false }))
    expect(recorrer(cerrada).eventos).toEqual([])
  })

  it('una subida larga es una sola vuelta: después de voltear hay una pausa', () => {
    expect(recorrer(movimiento(0.6, 0.5)).eventos).toEqual(['voltear'])
  })

  it('pasado el enfriamiento, otra subida vuelve a dar vuelta la hoja', () => {
    const otra = movimiento(0.3, 0.3, 1, ENFRIAMIENTO_S + 0.6)
    expect(recorrer([...movimiento(0.3, 0.3), ...otra]).eventos).toEqual(['voltear', 'voltear'])
  })

  it('el progreso crece con la subida, para que se vea que te entendió', () => {
    const muestras = movimiento(UMBRAL_SUBIDA_M / 2, 0.2)
    const { estado } = recorrer(muestras.slice(0, -1))
    expect(avanzarVoltear(estado, muestras[muestras.length - 1]).progreso).toBeCloseTo(0.5, 1)
  })
})
