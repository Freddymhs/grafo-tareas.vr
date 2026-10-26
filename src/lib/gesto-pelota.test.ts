import { describe, expect, it } from 'vitest'
import {
  BLOQUEO_REGRESO_S,
  ENFRIAMIENTO_S,
  GESTO_INICIAL,
  UMBRAL_GIRO,
  VENTANA_S,
  avanzarGesto,
  type EstadoGesto,
  type MuestraMano,
} from './gesto-pelota'

const GRADO = Math.PI / 180

/** Pasa una serie de muestras por el detector y junta los eventos. */
function recorrer(muestras: readonly MuestraMano[], inicial: EstadoGesto = GESTO_INICIAL) {
  return muestras.reduce(
    ({ estado, eventos }, muestra) => {
      const paso = avanzarGesto(estado, muestra)
      return { estado: paso.estado, eventos: paso.evento ? [...eventos, paso.evento] : eventos }
    },
    { estado: inicial, eventos: [] as string[] },
  )
}

/** Un giro de `grados` en `segundos`, muestreado a 30 Hz. */
function giro(grados: number, segundos: number, desde = 0, inicio = 0): MuestraMano[] {
  const pasos = Math.round(segundos * 30)
  return Array.from({ length: pasos + 1 }, (_, i) => ({
    t: inicio + (segundos * i) / pasos,
    angulo: desde + (grados * GRADO * i) / pasos,
    enPose: true,
  }))
}

describe('avanzarGesto — girar la pelota cambia de HU (FASE 15)', () => {
  it('un giro rápido a la izquierda pasa a la siguiente; a la derecha, a la anterior (Freddy, 2026-10-26: invertido)', () => {
    expect(recorrer(giro(100, 0.3)).eventos).toEqual(['anterior'])
    expect(recorrer(giro(-100, 0.3)).eventos).toEqual(['siguiente'])
  })

  it('un giro lento no cuenta: es mover la mano, no el gesto', () => {
    expect(recorrer(giro(100, 4 * VENTANA_S)).eventos).toEqual([])
  })

  it('sin la pose de la pelota (abierta o puño) el giro no cuenta', () => {
    const sinPose = giro(110, 0.3).map((m) => ({ ...m, enPose: false }))
    expect(recorrer(sinPose).eventos).toEqual([])
  })

  it('la mano vuelve sola después de girar: ese regreso no deshace el cambio (medido en Freddy, +114° y −110°)', () => {
    const ida = giro(110, 0.3)
    const vuelta = giro(-110, 0.3, 110 * GRADO, 0.8)
    expect(recorrer([...ida, ...vuelta]).eventos).toEqual(['anterior'])
  })

  it('pasado el bloqueo, girar al otro lado sí cuenta el gesto contrario', () => {
    const ida = giro(110, 0.3)
    const otra = giro(-110, 0.3, 110 * GRADO, BLOQUEO_REGRESO_S + 0.5)
    expect(recorrer([...ida, ...otra]).eventos).toEqual(['anterior', 'siguiente'])
  })

  it('un giro largo es una sola página: después de cambiar hay una pausa', () => {
    expect(recorrer(giro(170, 0.4)).eventos).toEqual(['anterior'])
    const despues = giro(100, 0.3, 0, ENFRIAMIENTO_S + 0.6)
    expect(recorrer([...giro(100, 0.3), ...despues]).eventos).toEqual(['anterior', 'anterior'])
  })

  it('cruzar la espalda (±180°) no se lee como una vuelta entera', () => {
    expect(recorrer(giro(100, 0.3, 160 * GRADO)).eventos).toEqual(['anterior'])
  })

  it('el progreso crece con el giro, para que se vea que te entendió', () => {
    const muestras = giro(UMBRAL_GIRO / GRADO / 2, 0.2)
    const { estado } = recorrer(muestras.slice(0, -1))
    expect(avanzarGesto(estado, muestras[muestras.length - 1]).progreso).toBeCloseTo(0.5, 1)
  })
})
