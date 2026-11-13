import { describe, expect, it } from 'vitest'
import { posicionesAGuardar } from './posiciones-a-guardar'

const nuevas = new Map([
  ['propio', { x: 1, y: 2, z: 3 }],
  ['ajeno', { x: 4, y: 5, z: 6 }],
  ['fantasma', { x: 7, y: 8, z: 9 }],
])
const hogar = new Map([
  ['propio', 'pagina'],
  ['ajeno', 'otra'],
  ['fantasma', 'pagina'],
])

describe('posicionesAGuardar — qué se manda a PUT /nodos/posiciones', () => {
  it('solo lo de esta página: un nodo de otra guarda la posición de la suya', () => {
    expect(posicionesAGuardar(nuevas, hogar, 'pagina', new Set()).map(({ id }) => id)).toEqual([
      'propio',
      'fantasma',
    ])
  })

  it('un fantasma movido no se guarda: su posición es la de su proyecto (D9)', () => {
    const resultado = posicionesAGuardar(nuevas, hogar, 'pagina', new Set(['fantasma']))
    expect(resultado).toEqual([{ id: 'propio', x: 1, y: 2, z: 3 }])
  })

  it('sin nada nuevo, no hay nada que guardar', () => {
    expect(posicionesAGuardar(new Map(), hogar, 'pagina', new Set())).toEqual([])
  })
})
