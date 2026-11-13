import { describe, expect, it, vi } from 'vitest'
import { Cara } from './dominio'
import { guardarUltimaVista, leerUltimaVista } from './ultima-vista'

/** Un localStorage de mentira: un Map. */
const almacen = () => {
  const datos = new Map<string, string>()
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void datos.set(clave, valor),
  }
}

describe('la última vista — la VR abre donde Freddy la dejó (2026-10-18)', () => {
  it('lo guardado vuelve igual: la HU y su cara', () => {
    const local = almacen()
    guardarUltimaVista(local, { libro: 2, cara: Cara.PLAN })
    expect(leerUltimaVista(local)).toEqual({ libro: 2, cara: Cara.PLAN })
  })

  it('lo guardado antes de la FASE 24 (sin espacio ni proyecto) sigue siendo válido', () => {
    const local = almacen()
    local.setItem('grafo-tareas.vr.ultima-vista', JSON.stringify({ libro: 2, cara: Cara.REAL }))
    expect(leerUltimaVista(local)).toEqual({ libro: 2, cara: Cara.REAL })
  })

  it('el espacio y el proyecto se guardan y vuelven; uno que no es texto invalida la vista', () => {
    const local = almacen()
    guardarUltimaVista(local, { libro: 0, cara: Cara.REAL, espacioId: 'e1', proyectoId: 'p1' })
    expect(leerUltimaVista(local)).toEqual({
      libro: 0,
      cara: Cara.REAL,
      espacioId: 'e1',
      proyectoId: 'p1',
    })
    local.setItem(
      'grafo-tareas.vr.ultima-vista',
      JSON.stringify({ libro: 0, cara: Cara.REAL, espacioId: 5 }),
    )
    expect(leerUltimaVista(local)).toBeNull()
  })

  it('sin nada guardado, o con algo que no es una vista, no hay última vista', () => {
    const local = almacen()
    expect(leerUltimaVista(local)).toBeNull()
    local.setItem('grafo-tareas.vr.ultima-vista', '{roto')
    expect(leerUltimaVista(local)).toBeNull()
    local.setItem('grafo-tareas.vr.ultima-vista', JSON.stringify({ libro: 1, cara: 'OTRA' }))
    expect(leerUltimaVista(local)).toBeNull()
    local.setItem('grafo-tareas.vr.ultima-vista', JSON.stringify({ libro: -1, cara: Cara.PLAN }))
    expect(leerUltimaVista(local)).toBeNull()
  })

  it('si el navegador no deja guardar ni leer (modo privado), no rompe: queda registrado', () => {
    const roto = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    const consola = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(leerUltimaVista(roto)).toBeNull()
    expect(() => guardarUltimaVista(roto, { libro: 0, cara: Cara.REAL })).not.toThrow()
    expect(consola).toHaveBeenCalledTimes(2)
    consola.mockRestore()
  })
})
