import { beforeEach, describe, expect, it } from 'vitest'
import { Cara, TipoConexion } from './dominio'
import { Filtro, filtrosDelEspacio } from './filtro'
import { decidirToque, useEstadoVr } from './estado-vr'

const NORMAL = { tipo: 'normal' } as const

describe('decidirToque', () => {
  it('sin selección, selecciona; tocar el mismo, deselecciona', () => {
    expect(decidirToque({ seleccionado: null, modo: NORMAL }, 'a')).toEqual({
      accion: 'seleccionar',
      id: 'a',
    })
    expect(decidirToque({ seleccionado: 'a', modo: NORMAL }, 'a')).toEqual({
      accion: 'deseleccionar',
    })
  })

  it('conectando, el tocado es el destino', () => {
    const modo = { tipo: 'conectando', origenId: 'a', conexion: TipoConexion.DEPENDE_DE } as const
    expect(decidirToque({ seleccionado: 'a', modo }, 'b')).toEqual({
      accion: 'conectar',
      origenId: 'a',
      destinoId: 'b',
      conexion: TipoConexion.DEPENDE_DE,
    })
  })

  it('conectando, tocar el mismo origen no conecta un nodo consigo mismo', () => {
    const modo = { tipo: 'conectando', origenId: 'a', conexion: TipoConexion.DEPENDE_DE } as const
    expect(decidirToque({ seleccionado: 'a', modo }, 'a')).toEqual({
      accion: 'seleccionar',
      id: 'a',
    })
  })
})

describe('useEstadoVr', () => {
  beforeEach(() => {
    useEstadoVr.setState({
      seleccionado: null,
      modo: NORMAL,
      resaltados: new Set(),
      aviso: null,
      libro: 0,
      espacioId: null,
      proyectoId: null,
      cara: Cara.REAL,
      filtro: Filtro.TODO,
      apuntado: null,
    })
  })

  it('empezar a conectar pide un nodo seleccionado; tocar otro vuelve a normal con el origen seleccionado', () => {
    const { empezarConexion, tocar } = useEstadoVr.getState()
    empezarConexion(TipoConexion.BLOQUEADA_POR)
    expect(useEstadoVr.getState().modo).toEqual(NORMAL)

    tocar('a')
    useEstadoVr.getState().empezarConexion(TipoConexion.BLOQUEADA_POR)
    expect(useEstadoVr.getState().modo.tipo).toBe('conectando')

    expect(useEstadoVr.getState().tocar('b').accion).toBe('conectar')
    expect(useEstadoVr.getState()).toMatchObject({ modo: NORMAL, seleccionado: 'a' })
  })

  it('deseleccionar apaga lo resaltado', () => {
    useEstadoVr.getState().tocar('a')
    useEstadoVr.getState().resaltar(['x', 'y'])
    expect(useEstadoVr.getState().resaltados.size).toBe(2)
    useEstadoVr.getState().tocar('a')
    expect(useEstadoVr.getState().resaltados.size).toBe(0)
  })

  it('cambiar de HU avanza dando la vuelta y suelta la selección: el nodo puede no estar en la otra', () => {
    useEstadoVr.getState().tocar('a')
    useEstadoVr.getState().cambiarLibro(1, 2)
    expect(useEstadoVr.getState()).toMatchObject({ libro: 1, seleccionado: null })
    useEstadoVr.getState().cambiarLibro(1, 2)
    expect(useEstadoVr.getState().libro).toBe(0)
    useEstadoVr.getState().irALibro(1)
    expect(useEstadoVr.getState().libro).toBe(1)
  })

  it('elegir espacio o proyecto vuelve a la primera HU y suelta la selección (FASE 24)', () => {
    useEstadoVr.getState().tocar('a')
    useEstadoVr.getState().irALibro(2)
    useEstadoVr.getState().verEspacio('e1')
    expect(useEstadoVr.getState()).toMatchObject({
      espacioId: 'e1',
      proyectoId: null,
      libro: 0,
      seleccionado: null,
    })
    useEstadoVr.getState().irALibro(1)
    useEstadoVr.getState().verProyecto('p1')
    expect(useEstadoVr.getState()).toMatchObject({ espacioId: 'e1', proyectoId: 'p1', libro: 0 })
    useEstadoVr.getState().verEspacio(null)
    expect(useEstadoVr.getState()).toMatchObject({ espacioId: null, proyectoId: null })
  })

  it('dar vuelta la hoja cambia de cara y suelta la selección; cambiar de HU vuelve siempre a lo real (FASE 17)', () => {
    useEstadoVr.getState().tocar('a')
    useEstadoVr.getState().verCara(Cara.PLAN)
    expect(useEstadoVr.getState()).toMatchObject({ cara: Cara.PLAN, libro: 0, seleccionado: null })
    useEstadoVr.getState().cambiarLibro(1, 2)
    expect(useEstadoVr.getState().cara).toBe(Cara.REAL)
    useEstadoVr.getState().verCara(Cara.PLAN)
    useEstadoVr.getState().irALibro(0)
    expect(useEstadoVr.getState().cara).toBe(Cara.REAL)
  })

  it('apuntar a un nodo (sin tocarlo) lo marca para ampliar su texto; cambiar de página lo suelta', () => {
    useEstadoVr.getState().apuntar('a')
    expect(useEstadoVr.getState().apuntado).toBe('a')
    useEstadoVr.getState().apuntar(null)
    expect(useEstadoVr.getState().apuntado).toBeNull()
    useEstadoVr.getState().apuntar('b')
    useEstadoVr.getState().cambiarLibro(1, 2)
    expect(useEstadoVr.getState().apuntado).toBeNull()
  })

  it('el filtro (FASE 17): se elige con la mano, el control lo alterna, y cambiar de HU no lo suelta', () => {
    const delMetodo = filtrosDelEspacio(true, [])
    useEstadoVr.getState().verFiltro(Filtro.PENDIENTE)
    useEstadoVr.getState().cambiarLibro(1, 2)
    expect(useEstadoVr.getState().filtro).toBe(Filtro.PENDIENTE)
    useEstadoVr.getState().alternarFiltro(delMetodo)
    expect(useEstadoVr.getState().filtro).toBe(Filtro.SIN_TRAMITES)
    useEstadoVr.getState().alternarFiltro(delMetodo)
    expect(useEstadoVr.getState().filtro).toBe(Filtro.LO_QUE_FRENA)
    useEstadoVr.getState().alternarFiltro(delMetodo)
    expect(useEstadoVr.getState().filtro).toBe(Filtro.TODO)
    useEstadoVr.getState().alternarFiltro(delMetodo)
    expect(useEstadoVr.getState().filtro).toBe(Filtro.PENDIENTE)
  })

  it('el botón B recorre solo los filtros del espacio: sin método se salta el 3, sin filtros no cambia (FASE 26)', () => {
    useEstadoVr.getState().verFiltro(Filtro.PENDIENTE)
    useEstadoVr.getState().alternarFiltro(filtrosDelEspacio(false, [{ tieneCiclo: true }]))
    expect(useEstadoVr.getState().filtro).toBe(Filtro.LO_QUE_FRENA)
    useEstadoVr.getState().verFiltro(Filtro.TODO)
    useEstadoVr.getState().alternarFiltro(filtrosDelEspacio(false, [{ tieneCiclo: false }]))
    expect(useEstadoVr.getState().filtro).toBe(Filtro.TODO)
  })
})
