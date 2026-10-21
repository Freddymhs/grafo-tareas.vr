import { describe, expect, it } from 'vitest'
import { EstadoNodo, TipoConexion, TipoNodo, type Nodo } from './dominio'
import { delDia, encendidosDelDia, textoDelDia } from './dia'

const nodo = (id: string, extra: Partial<Nodo> = {}): Nodo => ({
  id,
  tipo: TipoNodo.TAREA,
  titulo: id,
  estado: EstadoNodo.ABIERTO,
  ...extra,
})
const hilo = (
  origenId: string,
  destinoId: string,
  tipo: TipoConexion = TipoConexion.DEPENDE_DE,
) => ({
  id: `${origenId}-${destinoId}`,
  origenId,
  destinoId,
  tipo,
})

describe('delDia — las tarjetas de AHORA, en el orden en que Freddy las dejó en Herdr', () => {
  it('ordena por su lugar y deja fuera lo que no va hoy', () => {
    const nodos = [nodo('segunda', { hoy: 2 }), nodo('fuera'), nodo('primera', { hoy: 1 })]
    expect(delDia(nodos).map(({ id }) => id)).toEqual(['primera', 'segunda'])
  })
})

describe('encendidosDelDia — el lente «hoy»: lo del día y lo que lo frena (Freddy, 2026-10-21)', () => {
  const hu = nodo('hu', { tipo: TipoNodo.HISTORIA })
  const tarjeta = nodo('[25325] confirmar', { hoy: 1 })
  const fase = nodo('FASE 18 · Recepcionado · 25325', { tipo: TipoNodo.FASE })
  const otraTarjeta = nodo('[26981] buscador')
  const duda = nodo('¿pagina?', { tipo: TipoNodo.DUDA })
  const contestada = nodo('¿ya?', { tipo: TipoNodo.DUDA, estado: EstadoNodo.CERRADO })
  const persona = nodo('Thomas', { tipo: TipoNodo.PERSONA })

  it('enciende la tarjeta, su FASE, la HU y lo abierto que frena a cualquiera de las dos', () => {
    const nodos = [hu, tarjeta, fase, otraTarjeta, duda, contestada, persona]
    const conexiones = [
      hilo(tarjeta.id, duda.id, TipoConexion.BLOQUEADA_POR),
      hilo(fase.id, persona.id, TipoConexion.ESPERA_RESPUESTA_DE),
      hilo(tarjeta.id, contestada.id, TipoConexion.BLOQUEADA_POR),
      hilo(otraTarjeta.id, duda.id, TipoConexion.BLOQUEADA_POR),
      hilo(tarjeta.id, hu.id, TipoConexion.PERTENECE_A),
    ]
    expect([...encendidosDelDia(nodos, conexiones)].sort()).toEqual(
      [hu.id, tarjeta.id, fase.id, duda.id, persona.id].sort(),
    )
  })

  it('depender de algo ya mergeado no lo frena; la misma regla que la API (21-10)', () => {
    const fase38 = nodo('FASE 38 · Notificaciones · 26309', {
      tipo: TipoNodo.FASE,
      mergeada: true,
    })
    const nodos = [hu, tarjeta, fase, fase38]
    const conexiones = [hilo(fase.id, fase38.id, TipoConexion.DEPENDE_DE)]
    expect(encendidosDelDia(nodos, conexiones).has(fase38.id)).toBe(false)
  })

  it('sin nada para hoy en esta HU, solo queda la HU', () => {
    expect([...encendidosDelDia([hu, otraTarjeta], [])]).toEqual([hu.id])
  })
})

describe('textoDelDia — la segunda línea de la leyenda con el lente puesto', () => {
  it('cada tarjeta con su lugar del día; un hueco dice que esa está en otra HU', () => {
    const nodos = [nodo('[26981] buscador', { hoy: 3 }), nodo('[25325] confirmar', { hoy: 1 })]
    expect(textoDelDia(nodos)).toEqual(['1 · [25325] confirmar', '3 · [26981] buscador'])
  })

  it('sin tarjetas del día en esta HU, lo dice', () => {
    expect(textoDelDia([nodo('suelta')])).toEqual(['nada de hoy en esta HU'])
  })
})
