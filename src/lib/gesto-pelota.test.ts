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
  it('un giro rápido a la derecha pasa a la siguiente; a la izquierda, a la anterior', () => {
    expect(recorrer(giro(100, 0.3)).eventos).toEqual(['siguiente'])
    expect(recorrer(giro(-100, 0.3)).eventos).toEqual(['anterior'])
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
    expect(recorrer([...ida, ...vuelta]).eventos).toEqual(['siguiente'])
  })

  it('pasado el bloqueo, girar al otro lado sí vuelve a la anterior', () => {
    const ida = giro(110, 0.3)
    const otra = giro(-110, 0.3, 110 * GRADO, BLOQUEO_REGRESO_S + 0.5)
    expect(recorrer([...ida, ...otra]).eventos).toEqual(['siguiente', 'anterior'])
  })

  it('un giro largo es una sola página: después de cambiar hay una pausa', () => {
    expect(recorrer(giro(170, 0.4)).eventos).toEqual(['siguiente'])
    const despues = giro(100, 0.3, 0, ENFRIAMIENTO_S + 0.6)
    expect(recorrer([...giro(100, 0.3), ...despues]).eventos).toEqual(['siguiente', 'siguiente'])
  })

  it('cruzar la espalda (±180°) no se lee como una vuelta entera', () => {
    expect(recorrer(giro(100, 0.3, 160 * GRADO)).eventos).toEqual(['siguiente'])
  })

  it('el progreso crece con el giro, para que se vea que te entendió', () => {
    const muestras = giro(UMBRAL_GIRO / GRADO / 2, 0.2)
    const { estado } = recorrer(muestras.slice(0, -1))
    expect(avanzarGesto(estado, muestras[muestras.length - 1]).progreso).toBeCloseTo(0.5, 1)
  })
})
