import { describe, expect, it } from 'vitest'
import { EstadoNodo, TipoConexion, TipoNodo, type Grafo } from './dominio'
import { grafoDePagina, hogares, paginaVecina } from './paginas'

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
