import { describe, expect, it } from 'vitest'
import type { EspacioResponseDto, ProyectoResponseDto } from './api/generado/modelos'
import { MAX_PESTANAS_FILA, TEXTO_TODO, TEXTO_TODO_EL_ESPACIO } from './constants/alcance'
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
const SIN_ALCANCE = { espacioId: null, proyectoId: null }
const textos = (fila: readonly { texto: string }[]) => fila.map(({ texto }) => texto)

describe('filasDeAlcance — las pestañas de la barra superior (FASE 24, D2)', () => {
  it('fila 1: los espacios por orden, sin archivados, y «Todo» al final', () => {
    const { espacios } = filasDeAlcance(
      [espacio('b', 'Mis máquinas', 1), espacio('x', 'Viejo', 0, true), espacio('a', 'SIGSA', 0)],
      [],
      SIN_ALCANCE,
    )
    expect(textos(espacios)).toEqual(['SIGSA', 'Mis máquinas', TEXTO_TODO])
  })

  it('sin alcance, «Todo» es la activa y no hay segunda fila', () => {
    const { espacios, proyectos } = filasDeAlcance([espacio('a', 'SIGSA')], [], SIN_ALCANCE)
    expect(espacios.filter(({ activa }) => activa).map(({ texto }) => texto)).toEqual([TEXTO_TODO])
    expect(espacios.find(({ texto }) => texto === TEXTO_TODO)?.id).toBeNull()
    expect(proyectos).toEqual([])
  })

  it('con espacio, su pestaña está activa y la segunda fila es «Todo el espacio» + sus proyectos por orden', () => {
    const { espacios, proyectos } = filasDeAlcance(
      [espacio('e1', 'SIGSA')],
      [proyecto('p2', 'SII', 1), proyecto('p0', 'SAG', 0), proyecto('px', 'Viejo', 0, true)],
      { espacioId: 'e1', proyectoId: null },
    )
    expect(espacios.find(({ activa }) => activa)?.id).toBe('e1')
    expect(textos(proyectos)).toEqual([TEXTO_TODO_EL_ESPACIO, 'SAG', 'SII'])
    expect(proyectos.find(({ activa }) => activa)?.texto).toBe(TEXTO_TODO_EL_ESPACIO)
  })

  it('con proyecto, solo esa pestaña de la segunda fila está activa', () => {
    const { proyectos } = filasDeAlcance([espacio('e1', 'SIGSA')], [proyecto('p0', 'SAG')], {
      espacioId: 'e1',
      proyectoId: 'p0',
    })
    expect(proyectos.filter(({ activa }) => activa).map(({ id }) => id)).toEqual(['p0'])
  })

  it('el texto sale sin emojis y acotado', () => {
    const { espacios } = filasDeAlcance(
      [espacio('a', '🚀 Un espacio con un nombre larguísimo que no entra')],
      [],
      SIN_ALCANCE,
    )
    expect(espacios[0]?.texto).not.toContain('🚀')
    expect(espacios[0]?.texto.length).toBeLessThanOrEqual(18)
  })

  it('una fila se corta en MAX_PESTANAS_FILA sin perder la activa ni «Todo»', () => {
    const muchos = Array.from({ length: MAX_PESTANAS_FILA + 5 }, (_, i) =>
      espacio(`e${i}`, `E${i}`, i),
    )
    const activa = `e${MAX_PESTANAS_FILA + 3}`
    const { espacios } = filasDeAlcance(muchos, [], { espacioId: activa, proyectoId: null })
    expect(espacios).toHaveLength(MAX_PESTANAS_FILA)
    expect(espacios.some(({ id }) => id === activa)).toBe(true)
    expect(espacios.at(-1)?.texto).toBe(TEXTO_TODO)
  })
})
