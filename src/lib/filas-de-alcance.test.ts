import { describe, expect, it } from 'vitest'
import type { EspacioResponseDto, ProyectoResponseDto } from './api/generado/modelos'
import { LARGO_PESTANA, MAX_PESTANAS_FILA } from './constants/alcance'
import { filasDeAlcance } from './filas-de-alcance'

const espacio = (id: string, nombre: string, orden = 0, archivado = false): EspacioResponseDto => ({
  id,
  nombre,
  orden,
  archivado,
  etapas: [],
})
const proyecto = (
  id: string,
  nombre: string,
  orden = 0,
  archivado = false,
): ProyectoResponseDto => ({
  id,
  espacioId: 'e1',
  nombre,
  orden,
  archivado,
})
const ELEGIDO_E1 = { espacioId: 'e1', proyectoId: null }
const textos = (fila: readonly { texto: string }[]) => fila.map(({ texto }) => texto)

describe('filasDeAlcance — las pestañas de la barra superior (FASE 26, D1 y D2)', () => {
  it('fila 1: solo los espacios por orden, sin archivados y sin «Todo»', () => {
    const { espacios } = filasDeAlcance(
      [espacio('b', 'Mis máquinas', 1), espacio('x', 'Viejo', 0, true), espacio('a', 'SIGSA', 0)],
      [],
      { espacioId: 'a', proyectoId: null },
    )
    expect(textos(espacios)).toEqual(['SIGSA', 'Mis máquinas'])
  })

  it('con dos o más proyectos, la segunda fila son solo sus proyectos por orden, sin «Todo el espacio»', () => {
    const { espacios, proyectos } = filasDeAlcance(
      [espacio('e1', 'SIGSA')],
      [proyecto('p2', 'SII', 1), proyecto('p0', 'SAG', 0), proyecto('px', 'Viejo', 0, true)],
      { espacioId: 'e1', proyectoId: 'p0' },
    )
    expect(espacios.find(({ activa }) => activa)?.id).toBe('e1')
    expect(textos(proyectos)).toEqual(['SAG', 'SII'])
    expect(proyectos.filter(({ activa }) => activa).map(({ id }) => id)).toEqual(['p0'])
  })

  it('con un solo proyecto vigente (Mis máquinas) no hay segunda fila', () => {
    const { proyectos } = filasDeAlcance(
      [espacio('e1', 'Mis máquinas')],
      [proyecto('p0', 'General'), proyecto('px', 'Viejo', 1, true)],
      ELEGIDO_E1,
    )
    expect(proyectos).toEqual([])
  })

  it('sin proyectos tampoco hay segunda fila', () => {
    expect(filasDeAlcance([espacio('e1', 'Vacío')], [], ELEGIDO_E1).proyectos).toEqual([])
  })

  it('un proyecto vacío se muestra igual: la fila no cuenta nodos (D2)', () => {
    const { proyectos } = filasDeAlcance(
      [espacio('e1', 'SIGSA')],
      [proyecto('p0', 'SAG'), proyecto('p1', 'Recién creado', 1)],
      { espacioId: 'e1', proyectoId: 'p0' },
    )
    expect(textos(proyectos)).toEqual(['SAG', 'Recién creado'])
  })

  it('el texto sale sin emojis y acotado', () => {
    const { espacios } = filasDeAlcance(
      [espacio('a', '🚀 Un espacio con un nombre larguísimo que no entra')],
      [],
      { espacioId: 'a', proyectoId: null },
    )
    expect(espacios[0]?.texto).not.toContain('🚀')
    expect(espacios[0]?.texto.length).toBeLessThanOrEqual(LARGO_PESTANA)
  })

  it('una fila se corta en MAX_PESTANAS_FILA sin perder la activa', () => {
    const muchos = Array.from({ length: MAX_PESTANAS_FILA + 5 }, (_, i) =>
      espacio(`e${i}`, `E${i}`, i),
    )
    const activa = `e${MAX_PESTANAS_FILA + 3}`
    const { espacios } = filasDeAlcance(muchos, [], { espacioId: activa, proyectoId: null })
    expect(espacios).toHaveLength(MAX_PESTANAS_FILA)
    expect(espacios.some(({ id }) => id === activa)).toBe(true)
    expect(espacios.at(-1)?.id).toBe(activa)
  })
})
