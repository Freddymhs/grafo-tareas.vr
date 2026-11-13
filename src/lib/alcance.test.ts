import { describe, expect, it } from 'vitest'
import type { EspacioResponseDto, ProyectoResponseDto } from './api/generado/modelos'
import { paginaUnica, paramsDeAlcance, resolverAlcance } from './alcance'
import { AVISO_ESPACIO_INEXISTENTE, AVISO_PROYECTO_INEXISTENTE } from './constants/alcance'
import { Cara, EstadoNodo, TipoNodo, type Nodo } from './dominio'

const nodo = (id: string, estado: EstadoNodo = EstadoNodo.ABIERTO): Nodo => ({
  id,
  tipo: TipoNodo.TAREA,
  titulo: id,
  estado,
})

describe('paramsDeAlcance — del alcance a los parámetros de la API (FASE 24)', () => {
  it('sin alcance no manda nada: «Todo» pide lo mismo que antes', () => {
    expect(paramsDeAlcance({ espacioId: null, proyectoId: null })).toEqual({})
  })

  it('con espacio manda el espacio', () => {
    expect(paramsDeAlcance({ espacioId: 'e1', proyectoId: null })).toEqual({ espacio: 'e1' })
  })

  it('con proyecto manda solo el proyecto', () => {
    expect(paramsDeAlcance({ espacioId: 'e1', proyectoId: 'p1' })).toEqual({ proyecto: 'p1' })
  })
})

describe('paginaUnica — un espacio sin método no tiene HU: el proyecto entero es una página (D10)', () => {
  it('una página real con todos los ids y las abiertas contadas', () => {
    const pagina = paginaUnica(
      [nodo('a'), nodo('b', EstadoNodo.CERRADO), nodo('c')],
      'Mis máquinas',
    )
    expect(pagina).toMatchObject({
      cara: Cara.REAL,
      titulo: 'Mis máquinas',
      historiaId: null,
      nodos: ['a', 'b', 'c'],
      abiertas: 2,
      frenan: [],
    })
    expect(pagina.id).toBe(pagina.libro)
  })

  it('sin nodos, una página vacía (no rompe)', () => {
    expect(paginaUnica([], 'Vacío').nodos).toEqual([])
  })
})

const SIGSA: EspacioResponseDto = {
  id: 'e-sigsa',
  nombre: 'SIGSA',
  orden: 0,
  archivado: false,
  metodo: 'trabajo-hu',
  etapas: [],
}
const SAG: ProyectoResponseDto = {
  id: 'p-sag',
  espacioId: SIGSA.id,
  nombre: 'SAG',
  orden: 0,
  archivado: false,
}

describe('resolverAlcance — un id que ya no existe cae a «Todo» con aviso (D3)', () => {
  it('un espacio que no existe (archivado, borrado o de otra base) cae a Todo y avisa', () => {
    expect(resolverAlcance({ espacioId: 'x', proyectoId: null }, [SIGSA], [])).toEqual({
      alcance: { espacioId: null, proyectoId: null },
      aviso: AVISO_ESPACIO_INEXISTENTE,
    })
  })

  it('un proyecto que no existe cae a Todo el espacio y avisa', () => {
    expect(resolverAlcance({ espacioId: SIGSA.id, proyectoId: 'x' }, [SIGSA], [SAG])).toEqual({
      alcance: { espacioId: SIGSA.id, proyectoId: null },
      aviso: AVISO_PROYECTO_INEXISTENTE,
    })
  })

  it('con los proyectos todavía cargando conserva el proyecto, sin aviso', () => {
    expect(
      resolverAlcance({ espacioId: SIGSA.id, proyectoId: SAG.id }, [SIGSA], undefined),
    ).toEqual({ alcance: { espacioId: SIGSA.id, proyectoId: SAG.id }, aviso: null })
  })

  it('un alcance válido queda como está, sin aviso', () => {
    expect(resolverAlcance({ espacioId: SIGSA.id, proyectoId: SAG.id }, [SIGSA], [SAG])).toEqual({
      alcance: { espacioId: SIGSA.id, proyectoId: SAG.id },
      aviso: null,
    })
  })

  it('sin alcance, sin aviso', () => {
    expect(resolverAlcance({ espacioId: null, proyectoId: null }, [SIGSA], undefined)).toEqual({
      alcance: { espacioId: null, proyectoId: null },
      aviso: null,
    })
  })
})
