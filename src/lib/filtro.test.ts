import { describe, expect, it } from 'vitest'
import { EstadoNodo, TipoConexion, TipoNodo, type Nodo } from './dominio'
import {
  Filtro,
  encendidosPor,
  familiaFiltrada,
  filtroAlMostrar,
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

describe('familiaFiltrada — una selección con filtro enciende su familia, pero solo lo que el filtro deja (Freddy, 2026-10-19)', () => {
  const familia = ['thomas', 'duda-abierta', 'duda-contestada']

  it('con el 3, elegir a Thomas no enciende la duda que ya contestó: solo lo abierto y él', () => {
    const encendidos = new Set(['duda-abierta'])
    expect(familiaFiltrada(familia, encendidos, 'thomas')).toEqual(
      new Set(['thomas', 'duda-abierta']),
    )
  })

  it('con el 1 (todo) se ve la familia entera: ahí está el histórico', () => {
    expect(familiaFiltrada(familia, null, 'thomas')).toEqual(new Set(familia))
  })
})

describe('filtroAlMostrar — los dedos de la mano derecha eligen el filtro (Freddy, 2026-10-18)', () => {
  it('1 = todo, 2 = pendiente, 3 = pendiente sin trámites, 4 = lo que frena; el 5 todavía no elige nada', () => {
    expect(filtroAlMostrar(1, Filtro.SIN_TRAMITES)).toBe(Filtro.TODO)
    expect(filtroAlMostrar(2, Filtro.TODO)).toBe(Filtro.PENDIENTE)
    expect(filtroAlMostrar(3, Filtro.PENDIENTE)).toBe(Filtro.SIN_TRAMITES)
    expect(filtroAlMostrar(4, Filtro.TODO)).toBe(Filtro.LO_QUE_FRENA)
    expect([0, 5].map((n) => filtroAlMostrar(n, Filtro.PENDIENTE))).toEqual([null, null])
  })

  it('el número del filtro puesto lo apaga: vuelve a ver todo', () => {
    expect(filtroAlMostrar(2, Filtro.PENDIENTE)).toBe(Filtro.TODO)
    expect(filtroAlMostrar(3, Filtro.SIN_TRAMITES)).toBe(Filtro.TODO)
  })

  it('el botón B recorre todo → pendiente → sin trámites → lo que frena → todo; `?filtro=` acepta los mismos nombres', () => {
    expect(siguienteFiltro(Filtro.TODO)).toBe(Filtro.PENDIENTE)
    expect(siguienteFiltro(Filtro.PENDIENTE)).toBe(Filtro.SIN_TRAMITES)
    expect(siguienteFiltro(Filtro.SIN_TRAMITES)).toBe(Filtro.LO_QUE_FRENA)
    expect(siguienteFiltro(Filtro.LO_QUE_FRENA)).toBe(Filtro.TODO)
    expect(filtroDeTexto('sin-tramites')).toBe(Filtro.SIN_TRAMITES)
    expect(filtroDeTexto('lo-que-frena')).toBe(Filtro.LO_QUE_FRENA)
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

describe('encendidosPor — el filtro 4 deja solo lo que frena (Freddy, 2026-10-18)', () => {
  it('las dudas, las personas, lo «para decir» y la HU abiertos; ni tareas, ni FASE, ni una duda ya cerrada', () => {
    const nodos = [
      nodo('hu', { tipo: TipoNodo.HISTORIA }),
      nodo('duda', { tipo: TipoNodo.DUDA }),
      nodo('duda-cerrada', { tipo: TipoNodo.DUDA, estado: EstadoNodo.CERRADO }),
      nodo('carabantes', { tipo: TipoNodo.PERSONA }),
      nodo('para-decir', { tipo: TipoNodo.DAILY_ITEM }),
      nodo('pieza'),
      nodo('fase', { tipo: TipoNodo.FASE }),
    ]
    expect([...(encendidosPor(Filtro.LO_QUE_FRENA, nodos) ?? [])].sort()).toEqual([
      'carabantes',
      'duda',
      'hu',
      'para-decir',
    ])
  })

  it('con lo que la API dice que frena: también el trabajo del que otro depende, y no la duda que no frena nada', () => {
    const nodos = [
      nodo('hu', { tipo: TipoNodo.HISTORIA }),
      nodo('esquema'),
      nodo('duda-que-frena', { tipo: TipoNodo.DUDA }),
      nodo('duda-suelta', { tipo: TipoNodo.DUDA }),
      nodo('para-decir', { tipo: TipoNodo.DAILY_ITEM }),
      nodo('pieza'),
    ]
    const frenan = new Set(['esquema', 'duda-que-frena'])
    expect([...(encendidosPor(Filtro.LO_QUE_FRENA, nodos, frenan) ?? [])].sort()).toEqual([
      'duda-que-frena',
      'esquema',
      'hu',
      'para-decir',
    ])
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
