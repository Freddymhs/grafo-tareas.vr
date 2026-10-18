import { beforeEach, describe, expect, it } from 'vitest'
import { TipoConexion } from './dominio'
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
      pagina: 0,
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

  it('cambiar de página avanza dando la vuelta y suelta la selección: el nodo puede no estar en la otra', () => {
    useEstadoVr.getState().tocar('a')
    useEstadoVr.getState().cambiarPagina(1, 2)
    expect(useEstadoVr.getState()).toMatchObject({ pagina: 1, seleccionado: null })
    useEstadoVr.getState().cambiarPagina(1, 2)
    expect(useEstadoVr.getState().pagina).toBe(0)
    useEstadoVr.getState().irAPagina(1)
    expect(useEstadoVr.getState().pagina).toBe(1)
  })

  it('apuntar a un nodo (sin tocarlo) lo marca para ampliar su texto; cambiar de página lo suelta', () => {
    useEstadoVr.getState().apuntar('a')
    expect(useEstadoVr.getState().apuntado).toBe('a')
    useEstadoVr.getState().apuntar(null)
    expect(useEstadoVr.getState().apuntado).toBeNull()
    useEstadoVr.getState().apuntar('b')
    useEstadoVr.getState().cambiarPagina(1, 2)
    expect(useEstadoVr.getState().apuntado).toBeNull()
  })
})
