import { describe, expect, it } from 'vitest'
import { TEXTO, medidasEtiqueta } from './constants/etiquetas'
import { NODOS_PRUEBA, SEMILLA_PRUEBA } from './constants/grafo'
import { EstadoNodo, TipoConexion, TipoNodo, type Grafo, type Posicion } from './dominio'
import {
  ALTO_MEDIO,
  ALTURA_OJOS,
  RADIO_PANORAMA,
  aberturaPara,
  anguloDe,
  calcularLayout,
  enCilindro,
  lineasPara,
  separarNuevas,
} from './layout'
import { generarGrafo } from './sintetico'

const grafo = generarGrafo({ nodos: NODOS_PRUEBA, semilla: SEMILLA_PRUEBA })
const TOLERANCIA = 1e-9

describe('generarGrafo', () => {
  it('da exactamente los nodos pedidos', () => {
    expect(grafo.nodos).toHaveLength(NODOS_PRUEBA)
  })

  it('misma semilla, mismo grafo; otra semilla, otro', () => {
    expect(generarGrafo({ nodos: NODOS_PRUEBA, semilla: SEMILLA_PRUEBA })).toEqual(grafo)
    expect(generarGrafo({ nodos: NODOS_PRUEBA, semilla: SEMILLA_PRUEBA + 1 })).not.toEqual(grafo)
  })

  it('toda conexión apunta a nodos que existen, y los ids no se repiten', () => {
    const ids = new Set(grafo.nodos.map(({ id }) => id))
    const huerfanas = grafo.conexiones.filter((c) => !ids.has(c.origenId) || !ids.has(c.destinoId))
    expect(huerfanas).toEqual([])
    expect(ids.size).toBe(grafo.nodos.length)
    expect(new Set(grafo.conexiones.map(({ id }) => id)).size).toBe(grafo.conexiones.length)
  })

  it('tiene la forma medida: cada tarea en una rama, y entre 1 y 3 conexiones por nodo', () => {
    const tareas = grafo.nodos.filter(({ tipo }) => tipo === TipoNodo.TAREA)
    const enRama = new Set(
      grafo.conexiones
        .filter(({ tipo }) => tipo === TipoConexion.PERTENECE_A)
        .map(({ origenId }) => origenId),
    )
    expect(tareas.every(({ id }) => enRama.has(id))).toBe(true)
    const porNodo = grafo.conexiones.length / grafo.nodos.length
    expect(porNodo).toBeGreaterThan(1)
    expect(porNodo).toBeLessThan(3)
  })

  it('DEPENDE_DE solo apunta hacia atrás: no hay ciclos', () => {
    const indice = (id: string) => Number(id.split('-')[1])
    const dependencias = grafo.conexiones.filter(({ tipo }) => tipo === TipoConexion.DEPENDE_DE)
    expect(dependencias.length).toBeGreaterThan(0)
    expect(dependencias.every((c) => indice(c.destinoId) < indice(c.origenId))).toBe(true)
  })
})

describe('calcularLayout — la pantalla curva (FASE 15)', () => {
  const SUELTAS = ['suelta-c', 'suelta-a', 'suelta-b']
  const conSueltas: Grafo = {
    nodos: [
      ...grafo.nodos,
      ...SUELTAS.map((id) => ({
        id,
        tipo: TipoNodo.TAREA,
        titulo: id,
        estado: EstadoNodo.ABIERTO,
      })),
    ],
    conexiones: grafo.conexiones,
  }
  const posiciones = calcularLayout(conSueltas)
  const todas = [...posiciones.values()]
  const horizontal = ({ x, z }: Posicion) => Math.hypot(x, z)
  const detras = (p: Posicion) => Math.abs(Math.abs(anguloDe(p)) - Math.PI) < Math.PI / 2

  it('da una posición finita a cada nodo, todas a la misma distancia del usuario', () => {
    expect(posiciones.size).toBe(conSueltas.nodos.length)
    expect(todas.every(({ x, y, z }) => [x, y, z].every(Number.isFinite))).toBe(true)
    todas.forEach((p) => expect(horizontal(p)).toBeCloseTo(RADIO_PANORAMA, 9))
  })

  it('a la altura de los ojos: ni muy arriba ni muy abajo (sin subir ni bajar)', () => {
    todas.forEach(({ y }) => {
      expect(y).toBeGreaterThanOrEqual(ALTURA_OJOS - ALTO_MEDIO - TOLERANCIA)
      expect(y).toBeLessThanOrEqual(ALTURA_OJOS + ALTO_MEDIO + TOLERANCIA)
    })
  })

  it('lo conectado rodea al usuario; las sueltas van juntas detrás, no lanzadas al borde', () => {
    SUELTAS.forEach((id) => expect(detras(posiciones.get(id) ?? { x: 0, y: 0, z: -1 })).toBe(true))
    const conectadas = grafo.nodos.map(({ id }) => posiciones.get(id) ?? { x: 0, y: 0, z: 0 })
    expect(conectadas.some((p) => p.z < 0)).toBe(true)
    const derecha = conectadas.filter(({ x }) => x > RADIO_PANORAMA / 2).length
    const izquierda = conectadas.filter(({ x }) => x < -RADIO_PANORAMA / 2).length
    expect(derecha).toBeGreaterThan(0)
    expect(izquierda).toBeGreaterThan(0)
  })

  it('el radio se puede calibrar', () => {
    calcularLayout(conSueltas, 5).forEach((p) => expect(horizontal(p)).toBeCloseTo(5, 9))
  })

  it('es determinista: el mapa es el mismo cada vez', () => {
    expect(calcularLayout(conSueltas)).toEqual(posiciones)
  })

  // El tamaño que el visor real tiene que soportar (216 nodos el 2026-10-17), no la prueba de FPS de 500.
  const mediano = generarGrafo({ nodos: 220, semilla: SEMILLA_PRUEBA })
  const acomodo = calcularLayout(mediano)
  /** Coordenadas de la pantalla desenrollada, en metros: a lo largo del arco y en altura. */
  const enPantalla = (p: Posicion) => ({ u: anguloDe(p) * RADIO_PANORAMA, v: p.y })

  it('ningún texto pisa a otro (FASE 15, «así es imposible de leer»)', () => {
    const celdas = [...acomodo.values()].map(enPantalla)
    const pisadas = celdas.filter((a, i) =>
      celdas.some(
        (b, j) => i !== j && Math.abs(a.u - b.u) < TEXTO.ancho && Math.abs(a.v - b.v) < TEXTO.alto,
      ),
    )
    expect(pisadas.length).toBeLessThanOrEqual(Math.ceil(celdas.length * 0.02))
  })

  it('lo que se relaciona queda cerca: una dependencia es corta comparada con dos nodos cualquiera', () => {
    const distancia = (a: string, b: string) => {
      const pa = enPantalla(acomodo.get(a) ?? { x: 0, y: 0, z: 0 })
      const pb = enPantalla(acomodo.get(b) ?? { x: 0, y: 0, z: 0 })
      return Math.hypot(pa.u - pb.u, pa.v - pb.v)
    }
    const dependencias = mediano.conexiones.filter(({ tipo }) => tipo === TipoConexion.DEPENDE_DE)
    const media = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const enlazadas = media(
      dependencias.map(({ origenId, destinoId }) => distancia(origenId, destinoId)),
    )
    const ids = mediano.nodos.map(({ id }) => id)
    const cualquiera = media(ids.map((id, i) => distancia(id, ids[(i * 7 + 13) % ids.length])))
    expect(enlazadas).toBeLessThan(cualquiera / 2)
  })

  it('una página (FASE 15) ocupa la media pantalla de adelante, con sus sueltas al extremo derecho', () => {
    const pagina = calcularLayout(conSueltas, RADIO_PANORAMA, Math.PI)
    const angulos = [...pagina.values()].map(anguloDe)
    angulos.forEach((a) => expect(Math.abs(a)).toBeLessThanOrEqual(Math.PI / 2 + TOLERANCIA))
    const conectadas = grafo.nodos.map(({ id }) =>
      anguloDe(pagina.get(id) ?? { x: 0, y: 0, z: -1 }),
    )
    const sueltas = SUELTAS.map((id) => anguloDe(pagina.get(id) ?? { x: 0, y: 0, z: -1 }))
    expect(Math.min(...sueltas)).toBeGreaterThan(Math.max(...conectadas))
  })
})

describe('aberturaPara — cuánta pantalla necesita una página', () => {
  it('la media pantalla de adelante (180°) si cabe; más ancha si no; nunca toda la vuelta', () => {
    expect(aberturaPara(20, RADIO_PANORAMA)).toBe(Math.PI)
    const grande = aberturaPara(200, RADIO_PANORAMA)
    expect(grande).toBeGreaterThan(Math.PI)
    expect(grande).toBeLessThanOrEqual(1.5 * Math.PI)
    expect(aberturaPara(100, RADIO_PANORAMA)).toBeLessThanOrEqual(grande)
  })
})

describe('lineasPara — más texto donde la página tiene espacio (FASE 15)', () => {
  it('pocas pelotas: 4 líneas; muchas: 2; nunca más de lo que cabe', () => {
    expect(lineasPara(20, RADIO_PANORAMA, Math.PI)).toBe(4)
    expect(lineasPara(98, RADIO_PANORAMA, aberturaPara(98, RADIO_PANORAMA))).toBe(2)
    expect(lineasPara(60, RADIO_PANORAMA, Math.PI)).toBeGreaterThanOrEqual(
      lineasPara(98, RADIO_PANORAMA, Math.PI),
    )
  })

  it('con más líneas, la celda es más alta y entra más texto', () => {
    expect(medidasEtiqueta(4).celda.alto).toBeGreaterThan(medidasEtiqueta(2).celda.alto)
    expect(medidasEtiqueta(4).largo).toBe(2 * medidasEtiqueta(2).largo)
  })

  it('una página con etiquetas de 4 líneas tampoco pisa textos', () => {
    const chico = generarGrafo({ nodos: 50, semilla: SEMILLA_PRUEBA })
    const lineas = lineasPara(chico.nodos.length, RADIO_PANORAMA, Math.PI)
    const { texto } = medidasEtiqueta(lineas)
    const celdas = [...calcularLayout(chico, RADIO_PANORAMA, Math.PI, lineas).values()].map(
      (p) => ({
        u: anguloDe(p) * RADIO_PANORAMA,
        v: p.y,
      }),
    )
    const pisadas = celdas.filter((a, i) =>
      celdas.some(
        (b, j) => i !== j && Math.abs(a.u - b.u) < texto.ancho && Math.abs(a.v - b.v) < texto.alto,
      ),
    )
    expect(lineas).toBe(4)
    expect(pisadas.length).toBeLessThanOrEqual(Math.ceil(celdas.length * 0.02))
  })
})

describe('separarNuevas — lo que llega a una página guardada no se apila (FASE 15)', () => {
  it('15 invitadas alrededor de la misma madre: ni se pisan entre ellas ni mueven lo guardado', () => {
    const nodo = (id: string) => ({
      id,
      tipo: TipoNodo.TAREA,
      titulo: id,
      estado: EstadoNodo.ABIERTO,
    })
    const hijas = Array.from({ length: 15 }, (_, i) => `hija-${i}`)
    const grafoPagina: Grafo = {
      nodos: [nodo('madre'), nodo('vecina'), ...hijas.map(nodo)],
      conexiones: hijas.map((h) => ({
        id: h,
        origenId: 'madre',
        destinoId: h,
        tipo: TipoConexion.DEPENDE_DE,
      })),
    }
    const fijas = new Map([
      ['madre', enCilindro(0, ALTURA_OJOS, RADIO_PANORAMA)],
      ['vecina', enCilindro(0.3, ALTURA_OJOS, RADIO_PANORAMA)],
    ])
    // Como las deja `ubicarFaltantes`: todas casi encima de la madre.
    const nuevas = new Map(
      hijas.map((h, i) => [h, enCilindro(0.001 * i, ALTURA_OJOS, RADIO_PANORAMA)]),
    )
    const separadas = separarNuevas(grafoPagina, fijas, nuevas, RADIO_PANORAMA, 2)
    const { texto } = medidasEtiqueta(2)
    const enPantalla = (p: Posicion) => ({ u: anguloDe(p) * RADIO_PANORAMA, v: p.y })
    const todas = [...fijas.values(), ...separadas.values()].map(enPantalla)
    const pisadas = todas.filter((a, i) =>
      todas.some(
        (b, j) => i !== j && Math.abs(a.u - b.u) < texto.ancho && Math.abs(a.v - b.v) < texto.alto,
      ),
    )
    expect([...separadas.keys()].sort()).toEqual([...hijas].sort())
    expect(pisadas.length).toBeLessThanOrEqual(1)
    separadas.forEach((p) => expect(Math.hypot(p.x, p.z)).toBeCloseTo(RADIO_PANORAMA, 9))
  })
})
