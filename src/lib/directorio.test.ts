import { describe, expect, it } from 'vitest'
import type { EspacioResponseDto, ProyectoResponseDto } from './api/generado/modelos'
import { NOMBRE_OTRO_PROYECTO } from './constants/alcance'
import { armarDirectorio, conRotulo, rotuloFantasma } from './directorio'

const espacio = (id: string, nombre: string, archivado = false): EspacioResponseDto => ({
  id,
  nombre,
  orden: 0,
  archivado,
  etapas: [],
})
const proyecto = (
  id: string,
  espacioId: string,
  nombre: string,
  archivado = false,
): ProyectoResponseDto => ({ id, espacioId, nombre, orden: 0, archivado })

const SIGSA = espacio('e-sigsa', 'SIGSA')
const MAQUINAS = espacio('e-maq', 'Mis máquinas')
const VIEJO = espacio('e-viejo', 'Core', true)
const directorio = armarDirectorio([SIGSA, MAQUINAS, VIEJO], {
  [SIGSA.id]: [proyecto('p-sag', SIGSA.id, 'SAG')],
  [MAQUINAS.id]: [
    proyecto('p-tp', MAQUINAS.id, 'ThinkPad'),
    proyecto('p-mac', MAQUINAS.id, 'Mac Mini', true),
  ],
  [VIEJO.id]: [proyecto('p-core', VIEJO.id, 'Backend')],
})

describe('armarDirectorio — proyectoId → su proyecto y su espacio (D8)', () => {
  it('un proyecto activo de un espacio activo no está archivado', () => {
    expect(directorio.get('p-sag')).toEqual({
      proyecto: 'SAG',
      espacio: 'SIGSA',
      espacioId: 'e-sigsa',
      archivado: false,
    })
  })

  it('archivado por el proyecto o por su espacio', () => {
    expect(directorio.get('p-mac')?.archivado).toBe(true)
    expect(directorio.get('p-core')?.archivado).toBe(true)
  })

  it('un espacio sin lista de proyectos no rompe', () => {
    expect(armarDirectorio([SIGSA], {}).size).toBe(0)
  })
})

describe('rotuloFantasma — de qué proyecto viene un nodo atenuado', () => {
  it('el proyecto de referencia, o ninguna referencia, no es fantasma', () => {
    expect(rotuloFantasma('p-sag', 'p-sag', directorio)).toBeNull()
    expect(rotuloFantasma('p-sag', undefined, directorio)).toBeNull()
  })

  it('otro proyecto: «proyecto · espacio», con sufijo si está archivado', () => {
    expect(rotuloFantasma('p-tp', 'p-sag', directorio)).toBe('ThinkPad · Mis máquinas')
    expect(rotuloFantasma('p-mac', 'p-sag', directorio)).toBe('Mac Mini · Mis máquinas · archivado')
  })

  it('un id desconocido es «otro proyecto»', () => {
    expect(rotuloFantasma('p-nadie', 'p-sag', directorio)).toBe(NOMBRE_OTRO_PROYECTO)
  })
})

describe('conRotulo — el título de un fantasma lleva su proyecto', () => {
  it('antepone el rótulo; sin rótulo, el texto como está', () => {
    expect(conRotulo('Atajos', 'ThinkPad · Mis máquinas')).toBe('(ThinkPad · Mis máquinas) Atajos')
    expect(conRotulo('Atajos', undefined)).toBe('Atajos')
  })
})
