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
