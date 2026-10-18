import { describe, expect, it } from 'vitest'
import {
  CURVATURA_ESTIRADO_MAXIMA,
  CURVATURA_PULGAR_ESTIRADO_MAXIMA,
  NUMERO_INICIAL,
  SOSTENER_S,
  avanzarNumero,
  numeroDeLaMano,
  type CurvaturasMano,
  type EstadoNumero,
  type MuestraNumero,
} from './conteo-dedos'

/** Valores medidos en Freddy: abierta 0,00–0,01 · puño 0,64–0,72. */
const ESTIRADO = 0.01
const CERRADO = 0.68

/** Una mano con estos dedos estirados y el resto cerrados. */
function mano(estirados: readonly (keyof CurvaturasMano)[]): CurvaturasMano {
  const valor = (dedo: keyof CurvaturasMano) => (estirados.includes(dedo) ? ESTIRADO : CERRADO)
  return {
    pulgar: valor('pulgar'),
    indice: valor('indice'),
    medio: valor('medio'),
    anular: valor('anular'),
    menique: valor('menique'),
  }
}

describe('numeroDeLaMano — cada número es una forma de mano, la de Freddy (2026-10-18)', () => {
  it('2 índice y medio · 3 medio, anular y meñique · 4 los cuatro · 5 los cinco', () => {
    expect(numeroDeLaMano(mano(['indice', 'medio']))).toBe(2)
    expect(numeroDeLaMano(mano(['medio', 'anular', 'menique']))).toBe(3)
    expect(numeroDeLaMano(mano(['indice', 'medio', 'anular', 'menique']))).toBe(4)
    expect(numeroDeLaMano(mano(['pulgar', 'indice', 'medio', 'anular', 'menique']))).toBe(5)
  })

  it('en el 2 y el 3 el pulgar no importa (el visor lo lee con ruido); en el 4 y el 5 decide', () => {
    expect(numeroDeLaMano(mano(['pulgar', 'indice', 'medio']))).toBe(2)
    expect(numeroDeLaMano(mano(['pulgar', 'medio', 'anular', 'menique']))).toBe(3)
  })

  it('lo que no es una de esas formas no es un número: el puño, contar «a lo ancho», un dedo suelto', () => {
    expect(numeroDeLaMano(mano([]))).toBe(0)
    // El índice solo es la pose de apuntar con el rayo (Freddy en el visor, 2026-10-18): con o sin pulgar.
    expect(numeroDeLaMano(mano(['indice']))).toBe(0)
    expect(numeroDeLaMano(mano(['pulgar', 'indice']))).toBe(0)
    expect(numeroDeLaMano(mano(['indice', 'medio', 'anular']))).toBe(0)
    expect(numeroDeLaMano(mano(['menique']))).toBe(0)
    expect(numeroDeLaMano(mano(['pulgar']))).toBe(0)
  })

  it('un dedo perdido (NaN) no cuenta como estirado', () => {
    expect(numeroDeLaMano({ ...mano(['indice', 'medio', 'anular']), anular: Number.NaN })).toBe(2)
  })

  it('el pulgar tiene su propio límite, más exigente que el de los otros dedos', () => {
    const aMedias = (CURVATURA_PULGAR_ESTIRADO_MAXIMA + CURVATURA_ESTIRADO_MAXIMA) / 2
    const cuatro = mano(['indice', 'medio', 'anular', 'menique'])
    expect(numeroDeLaMano({ ...cuatro, pulgar: aMedias })).toBe(4)
    expect(numeroDeLaMano({ ...mano(['medio']), indice: aMedias })).toBe(2)
  })
})

/** Pasa una serie de muestras por el detector y junta los eventos. */
function recorrer(muestras: readonly MuestraNumero[], inicial: EstadoNumero = NUMERO_INICIAL) {
  return muestras.reduce(
    ({ estado, eventos }, muestra) => {
      const paso = avanzarNumero(estado, muestra)
      return {
        estado: paso.estado,
        eventos: paso.evento !== null ? [...eventos, paso.evento] : eventos,
      }
    },
    { estado: inicial, eventos: [] as number[] },
  )
}

/** Un número sostenido `segundos`, muestreado a 30 Hz. */
function sostener(numero: number, segundos: number, inicio = 0, alzada = true): MuestraNumero[] {
  const pasos = Math.round(segundos * 30)
  return Array.from({ length: pasos + 1 }, (_, i) => ({
    t: inicio + (segundos * i) / pasos,
    numero,
    alzada,
  }))
}

describe('avanzarNumero — un número sostenido con la mano alzada se avisa una vez (FASE 17)', () => {
  it('sostener el número el tiempo justo lo avisa una vez', () => {
    expect(recorrer(sostener(2, SOSTENER_S + 0.2)).eventos).toEqual([2])
  })

  it('sostenerlo mucho más no lo repite', () => {
    expect(recorrer(sostener(2, 5)).eventos).toEqual([2])
  })

  it('cambiar de 2 a 3 avisa el 3', () => {
    const dos = sostener(2, 1)
    const tres = sostener(3, 1, 1.1)
    expect(recorrer([...dos, ...tres]).eventos).toEqual([2, 3])
  })

  it('con la mano baja no avisa nada', () => {
    expect(recorrer(sostener(2, 2, 0, false)).eventos).toEqual([])
  })

  it('el puño (0 dedos) no avisa nada', () => {
    expect(recorrer(sostener(0, 2)).eventos).toEqual([])
  })

  it('un parpadeo de 0,2 s no avisa', () => {
    const parpadeo = [...sostener(2, 0.2), ...sostener(0, 1, 0.25)]
    expect(recorrer(parpadeo).eventos).toEqual([])
  })

  it('bajar la mano y volver a mostrar el mismo número lo avisa de nuevo', () => {
    const primera = sostener(2, 1)
    const abajo = sostener(2, 0.5, 1.1, false)
    const segunda = sostener(2, 1, 1.7)
    expect(recorrer([...primera, ...abajo, ...segunda]).eventos).toEqual([2, 2])
  })

  it('el progreso crece mientras se sostiene, para que se vea que te entendió', () => {
    const muestras = sostener(4, SOSTENER_S / 2)
    const { estado } = recorrer(muestras.slice(0, -1))
    expect(avanzarNumero(estado, muestras[muestras.length - 1]).progreso).toBeCloseTo(0.5, 1)
  })
})
