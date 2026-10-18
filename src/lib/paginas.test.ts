import { describe, expect, it } from 'vitest'
import { Cara, EstadoNodo, TipoConexion, TipoNodo, type Grafo } from './dominio'
import {
  caraVisible,
  fechaCorta,
  grafoDePagina,
  hogares,
  librosDe,
  otraCara,
  paginaVecina,
  ramasDePagina,
  sinPadre,
  textoConFecha,
} from './paginas'

const nodo = (id: string) => ({ id, tipo: TipoNodo.TAREA, titulo: id, estado: EstadoNodo.ABIERTO })
const grafo: Grafo = {
  nodos: [nodo('a'), nodo('b'), nodo('c')],
  conexiones: [
    { id: 'ab', origenId: 'a', destinoId: 'b', tipo: TipoConexion.DEPENDE_DE },
    { id: 'bc', origenId: 'b', destinoId: 'c', tipo: TipoConexion.DEPENDE_DE },
  ],
}

describe('paginaVecina — X / girar la pelota (FASE 15)', () => {
  it('avanza y retrocede dando la vuelta', () => {
    expect(paginaVecina(0, 1, 3)).toBe(1)
    expect(paginaVecina(2, 1, 3)).toBe(0)
    expect(paginaVecina(0, -1, 3)).toBe(2)
  })

  it('sin páginas se queda en 0', () => {
    expect(paginaVecina(0, 1, 0)).toBe(0)
  })
})

describe('grafoDePagina — la VR muestra lo que la API puso en la página', () => {
  it('solo esos nodos, y las conexiones entre ellos', () => {
    const pagina = grafoDePagina(grafo, ['a', 'b'])
    expect(pagina.nodos.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(pagina.conexiones.map(({ id }) => id)).toEqual(['ab'])
  })
})

describe('hogares — de qué página es la posición guardada de cada nodo', () => {
  it('un nodo que está en dos páginas es de la primera', () => {
    const hogar = hogares([
      { id: 'hu-1', nodos: ['a', 'persona'] },
      { id: 'hu-2', nodos: ['b', 'persona'] },
    ])
    expect(hogar.get('persona')).toBe('hu-1')
    expect(hogar.get('b')).toBe('hu-2')
  })
})

describe('sinPadre — los nodos que llevan su fecha a la vista (FASE 15)', () => {
  it('sin padre: la HU (raíz) y lo suelto; con padre: lo que cuelga de algo. La rama no es padre: es el color', () => {
    const n = (id: string, tipo: TipoNodo) => ({ id, tipo, titulo: id, estado: EstadoNodo.ABIERTO })
    const arbol: Grafo = {
      nodos: [
        n('hu', TipoNodo.HISTORIA),
        n('fase', TipoNodo.FASE),
        n('tarjeta', TipoNodo.TAREA),
        n('rama', TipoNodo.RAMA),
        n('suelta', TipoNodo.TAREA),
        n('pintada', TipoNodo.TAREA),
      ],
      conexiones: [
        { id: '1', origenId: 'fase', destinoId: 'hu', tipo: TipoConexion.PERTENECE_A },
        { id: '2', origenId: 'tarjeta', destinoId: 'fase', tipo: TipoConexion.PERTENECE_A },
        { id: '3', origenId: 'pintada', destinoId: 'rama', tipo: TipoConexion.PERTENECE_A },
      ],
    }
    expect([...sinPadre(arbol)].sort()).toEqual(['hu', 'pintada', 'rama', 'suelta'])
  })
})

describe('fechaCorta — la fecha que se lee de un vistazo', () => {
  it('día y mes abreviado, como en tus tarjetas («14-oct»)', () => {
    expect(fechaCorta('2026-10-14T19:50:39.673Z')).toBe('14-oct')
    expect(fechaCorta('2026-09-03T10:00:00.000Z')).toBe('03-sep')
  })
})

describe('textoConFecha — la fecha adelante, sin repetirla', () => {
  it('agrega la fecha; si el título ya empieza con una («13-sep · …»), lo deja como está', () => {
    expect(textoConFecha('preguntas', '2026-10-07T01:02:32.147Z')).toBe('07-oct · preguntas')
    expect(textoConFecha('13-sep · Confirmar TOPE', '2026-09-13T10:00:00.000Z')).toBe(
      '13-sep · Confirmar TOPE',
    )
    expect(textoConFecha('1-oct · retro', '2026-10-01T10:00:00.000Z')).toBe('1-oct · retro')
  })
})

describe('librosDe — las dos caras de cada HU son un libro (FASE 17)', () => {
  const pagina = (libro: string, cara: Cara) => ({
    id: cara === Cara.PLAN ? `${libro}:plan` : libro,
    libro,
    cara,
  })
  const libros = librosDe([
    pagina('HU 1', Cara.REAL),
    pagina('HU 2', Cara.REAL),
    pagina('HU 2', Cara.PLAN),
    pagina('sin-hu', Cara.REAL),
  ])

  it('un libro por HU, en el orden de la API, con su cara real y la del plan si tiene', () => {
    expect(libros.map(({ id, real, plan }) => [id, real?.id ?? null, plan?.id ?? null])).toEqual([
      ['HU 1', 'HU 1', null],
      ['HU 2', 'HU 2', 'HU 2:plan'],
      ['sin-hu', 'sin-hu', null],
    ])
  })

  it('se ve la cara pedida; si el libro no la tiene, la que tiene', () => {
    const [sinPlan, conPlan] = libros
    expect(caraVisible(conPlan, Cara.PLAN)?.id).toBe('HU 2:plan')
    expect(caraVisible(conPlan, Cara.REAL)?.id).toBe('HU 2')
    expect(caraVisible(sinPlan, Cara.PLAN)?.id).toBe('HU 1')
    expect(caraVisible(librosDe([pagina('x', Cara.PLAN)])[0], Cara.REAL)?.id).toBe('x:plan')
  })

  it('dar vuelta la hoja va a la otra cara; un libro de una sola cara no tiene otra', () => {
    const [sinPlan, conPlan] = libros
    expect(otraCara(conPlan, Cara.REAL)).toBe(Cara.PLAN)
    expect(otraCara(conPlan, Cara.PLAN)).toBe(Cara.REAL)
    expect(otraCara(sinPlan, Cara.REAL)).toBeNull()
  })
})

describe('ramasDePagina — la leyenda nombra solo los colores de la página que se ve (Freddy, 2026-10-18)', () => {
  it('las ramas a las que pertenece algo de la página; las de otras páginas, no', () => {
    const rama = (id: string) => ({
      id,
      tipo: TipoNodo.RAMA,
      titulo: id,
      estado: EstadoNodo.ABIERTO,
    })
    const conRamas: Grafo = {
      nodos: [...grafo.nodos, rama('azul'), rama('verde')],
      conexiones: [
        ...grafo.conexiones,
        { id: 'a-azul', origenId: 'a', destinoId: 'azul', tipo: TipoConexion.PERTENECE_A },
        { id: 'c-verde', origenId: 'c', destinoId: 'verde', tipo: TipoConexion.PERTENECE_A },
        { id: 'b-verde', origenId: 'b', destinoId: 'verde', tipo: TipoConexion.DEPENDE_DE },
      ],
    }
    expect([...ramasDePagina(conRamas, ['a', 'b'])]).toEqual(['azul'])
    expect([...ramasDePagina(conRamas, ['c'])]).toEqual(['verde'])
  })
})
