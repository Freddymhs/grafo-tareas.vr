import { describe, expect, it } from 'vitest'
import { EstadoNodo, TipoConexion, TipoNodo, type Nodo } from './dominio'
import {
  Filtro,
  encendidosPor,
  filtroDeNumero,
  filtroDeTexto,
  hilosDelFiltro,
  pendientes,
  siguienteFiltro,
} from './filtro'

const nodo = (id: string, extra: Partial<Nodo> = {}): Nodo => ({
  id,
  tipo: TipoNodo.TAREA,
  titulo: id,
  estado: EstadoNodo.ABIERTO,
  ...extra,
})

describe('filtroDeNumero — los dedos de la mano derecha eligen el filtro (Freddy, 2026-10-18)', () => {
  it('de menor a mayor: 1 = todo (por defecto), 2 = pendiente, 3 = pendiente sin trámites; 4 y 5 todavía no hacen nada', () => {
    expect(filtroDeNumero(1)).toBe(Filtro.TODO)
    expect(filtroDeNumero(2)).toBe(Filtro.PENDIENTE)
    expect(filtroDeNumero(3)).toBe(Filtro.SIN_TRAMITES)
    expect([0, 4, 5].map(filtroDeNumero)).toEqual([null, null, null])
  })

  it('el botón B recorre todo → pendiente → sin trámites → todo; `?filtro=` acepta los mismos nombres', () => {
    expect(siguienteFiltro(Filtro.TODO)).toBe(Filtro.PENDIENTE)
    expect(siguienteFiltro(Filtro.PENDIENTE)).toBe(Filtro.SIN_TRAMITES)
    expect(siguienteFiltro(Filtro.SIN_TRAMITES)).toBe(Filtro.TODO)
    expect(filtroDeTexto('sin-tramites')).toBe(Filtro.SIN_TRAMITES)
    expect(filtroDeTexto('cualquiera')).toBe(Filtro.TODO)
    expect(filtroDeTexto(null)).toBe(Filtro.TODO)
  })
})

describe('encendidosPor — el filtro 3 apaga además los trámites de cierre (Freddy, 2026-10-18)', () => {
  const nodos = [
    nodo('tramite-abierto', { tramite: true }),
    nodo('tarea-abierta'),
    nodo('cerrada', { estado: EstadoNodo.CERRADO }),
  ]
  it('con «todo» no se apaga nada; «pendiente» deja el trámite; «sin trámites» lo apaga', () => {
    expect(encendidosPor(Filtro.TODO, nodos)).toBeNull()
    expect([...(encendidosPor(Filtro.PENDIENTE, nodos) ?? [])].sort()).toEqual([
      'tarea-abierta',
      'tramite-abierto',
    ])
    expect([...(encendidosPor(Filtro.SIN_TRAMITES, nodos) ?? [])]).toEqual(['tarea-abierta'])
  })
})

describe('pendientes — lo que el filtro deja encendido: ni mergeado ni cerrado', () => {
  it('la FASE mergeada y lo cerrado se apagan; lo abierto (las hijas que quedaron) sigue', () => {
    const encendidos = pendientes([
      nodo('fase-mergeada', { tipo: TipoNodo.FASE, mergeada: true }),
      nodo('tarjeta-cerrada', { estado: EstadoNodo.CERRADO }),
      nodo('duda-abierta', { tipo: TipoNodo.DUDA }),
      nodo('fase-sin-mergear', { tipo: TipoNodo.FASE }),
    ])
    expect([...encendidos].sort()).toEqual(['duda-abierta', 'fase-sin-mergear'])
  })
})

describe('hilosDelFiltro — un hilo brilla si lleva a algo pendiente (Freddy, 2026-10-18)', () => {
  const { PERTENECE_A, BLOQUEADA_POR } = TipoConexion
  const hilo = (id: string, origenId: string, tipo: TipoConexion, destinoId: string) => ({
    id,
    origenId,
    destinoId,
    tipo,
  })
  const conexiones = [
    hilo('f19-hu', 'fase-19', PERTENECE_A, 'hu'),
    hilo('cerrada-f19', 'cerrada', PERTENECE_A, 'fase-19'),
    hilo('f20-hu', 'fase-20', PERTENECE_A, 'hu'),
    hilo('abierta-f20', 'abierta', PERTENECE_A, 'fase-20'),
    hilo('abierta-duda', 'abierta', BLOQUEADA_POR, 'duda'),
    hilo('cerrada-duda', 'cerrada', BLOQUEADA_POR, 'duda'),
  ]
  const pendientesDeLaPagina = new Set(['hu', 'abierta', 'duda'])
  const encendidos = hilosDelFiltro(conexiones, pendientesDeLaPagina)

  it('pertenencia: brilla si debajo de la hija queda algo pendiente; la FASE sin nada pendiente se apaga entera', () => {
    expect(encendidos.has('abierta-f20')).toBe(true)
    expect(encendidos.has('f20-hu')).toBe(true)
    expect(encendidos.has('f19-hu')).toBe(false)
    expect(encendidos.has('cerrada-f19')).toBe(false)
  })

  it('dependencia: brilla si las dos puntas siguen pendientes (un bloqueo de algo ya cerrado no importa)', () => {
    expect(encendidos.has('abierta-duda')).toBe(true)
    expect(encendidos.has('cerrada-duda')).toBe(false)
  })

  it('un ciclo de pertenencias no lo cuelga', () => {
    const ciclo = [hilo('a-b', 'a', PERTENECE_A, 'b'), hilo('b-a', 'b', PERTENECE_A, 'a')]
    expect([...hilosDelFiltro(ciclo, new Set())]).toEqual([])
  })
})
