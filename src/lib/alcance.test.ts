import { describe, expect, it } from 'vitest'
import type { EspacioResponseDto, ProyectoResponseDto } from './api/generado/modelos'
import { paginaUnica, paramsDeAlcance, resolverAlcance, resolverEspacio } from './alcance'
import { AVISO_ESPACIO_INEXISTENTE, AVISO_PROYECTO_INEXISTENTE } from './constants/alcance'
import { Cara, EstadoNodo, TipoNodo, type Nodo } from './dominio'

const nodo = (id: string, estado: EstadoNodo = EstadoNodo.ABIERTO): Nodo => ({
  id,
  tipo: TipoNodo.TAREA,
  titulo: id,
  estado,
})

describe('paramsDeAlcance — del alcance a los parámetros de la API (FASE 24)', () => {
  it('sin alcance (todavía sin espacios) no manda nada', () => {
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
  orden: 1,
  archivado: false,
  metodo: 'trabajo-hu',
  etapas: [],
}
const MAQUINAS: EspacioResponseDto = {
  id: 'e-maq',
  nombre: 'Mis máquinas',
  orden: 0,
  archivado: false,
  etapas: [],
}
const ARCHIVADO: EspacioResponseDto = { ...MAQUINAS, id: 'e-viejo', orden: -1, archivado: true }
const ESPACIOS = [SIGSA, ARCHIVADO, MAQUINAS]
const proyecto = (id: string, nombre: string, orden: number): ProyectoResponseDto => ({
  id,
  espacioId: SIGSA.id,
  nombre,
  orden,
  archivado: false,
})
const GENERAL = proyecto('p-general', 'General', 1)
const SAG = proyecto('p-sag', 'SAG', 0)
const DE_SIGSA = [GENERAL, SAG]
const SIN_PEDIDO = { espacioId: null, proyectoId: null }

describe('resolverEspacio — el espacio que se ve nunca es «todo» (FASE 26, D1)', () => {
  it('sin espacio pedido, el primero vigente por orden, sin aviso', () => {
    expect(resolverEspacio(null, ESPACIOS)).toEqual({ espacioId: MAQUINAS.id, aviso: null })
  })

  it('un espacio que no existe (archivado, borrado o de otra base) cae al primero y avisa', () => {
    expect(resolverEspacio(ARCHIVADO.id, ESPACIOS)).toEqual({
      espacioId: MAQUINAS.id,
      aviso: AVISO_ESPACIO_INEXISTENTE,
    })
  })

  it('un espacio que existe queda, sin aviso', () => {
    expect(resolverEspacio(SIGSA.id, ESPACIOS)).toEqual({ espacioId: SIGSA.id, aviso: null })
  })

  it('sin espacios (todavía no llegaron), ninguno', () => {
    expect(resolverEspacio(null, [])).toEqual({ espacioId: null, aviso: null })
  })
})

describe('resolverAlcance — el alcance efectivo nunca es «todo» (FASE 26, D1 y D2)', () => {
  it('sin nada pedido: el primer espacio; sin fila de proyectos, el espacio entero', () => {
    expect(resolverAlcance(SIN_PEDIDO, ESPACIOS, [])).toEqual({
      alcance: { espacioId: MAQUINAS.id, proyectoId: null },
      aviso: null,
    })
  })

  it('con un solo proyecto (Mis máquinas) se ve el espacio entero aunque se haya pedido ese proyecto', () => {
    const general = { ...GENERAL, espacioId: MAQUINAS.id }
    expect(
      resolverAlcance({ espacioId: MAQUINAS.id, proyectoId: general.id }, ESPACIOS, [general]),
    ).toEqual({ alcance: { espacioId: MAQUINAS.id, proyectoId: null }, aviso: null })
  })

  it('con fila de proyectos y sin proyecto pedido, el primero por orden, sin aviso', () => {
    expect(resolverAlcance({ espacioId: SIGSA.id, proyectoId: null }, ESPACIOS, DE_SIGSA)).toEqual({
      alcance: { espacioId: SIGSA.id, proyectoId: SAG.id },
      aviso: null,
    })
  })

  it('un proyecto que no existe cae al primero y avisa', () => {
    expect(resolverAlcance({ espacioId: SIGSA.id, proyectoId: 'x' }, ESPACIOS, DE_SIGSA)).toEqual({
      alcance: { espacioId: SIGSA.id, proyectoId: SAG.id },
      aviso: AVISO_PROYECTO_INEXISTENTE,
    })
  })

  it('un espacio que no existe cae al primero, avisa y suelta el proyecto pedido (era de otro espacio)', () => {
    expect(resolverAlcance({ espacioId: 'x', proyectoId: SAG.id }, ESPACIOS, [])).toEqual({
      alcance: { espacioId: MAQUINAS.id, proyectoId: null },
      aviso: AVISO_ESPACIO_INEXISTENTE,
    })
  })

  it('con los proyectos todavía cargando conserva el proyecto pedido, sin aviso', () => {
    expect(
      resolverAlcance({ espacioId: SIGSA.id, proyectoId: SAG.id }, ESPACIOS, undefined),
    ).toEqual({ alcance: { espacioId: SIGSA.id, proyectoId: SAG.id }, aviso: null })
  })

  it('un alcance válido queda como está, sin aviso', () => {
    expect(
      resolverAlcance({ espacioId: SIGSA.id, proyectoId: GENERAL.id }, ESPACIOS, DE_SIGSA),
    ).toEqual({ alcance: { espacioId: SIGSA.id, proyectoId: GENERAL.id }, aviso: null })
  })
})
