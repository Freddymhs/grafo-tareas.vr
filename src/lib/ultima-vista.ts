// Abrir donde se dejó (Freddy, 2026-10-18): la VR recuerda la última HU y su cara en el navegador del visor. Es una
// comodidad de este visor, no un dato del grafo: si el navegador no deja guardar (modo privado), se abre en la primera.
import { Cara } from './dominio'
import { registrarError } from './registro'

const CLAVE = 'grafo-tareas.vr.ultima-vista'

export interface UltimaVista {
  /** El índice del libro (la HU) entre los de `GET /derivado/paginas`. */
  readonly libro: number
  readonly cara: Cara
}

const esCara = (valor: unknown): valor is Cara => Object.values<unknown>(Cara).includes(valor)

function esUltimaVista(valor: unknown): valor is UltimaVista {
  if (typeof valor !== 'object' || valor === null) return false
  const { libro, cara } = valor as Record<string, unknown>
  return typeof libro === 'number' && Number.isInteger(libro) && libro >= 0 && esCara(cara)
}

export function leerUltimaVista(almacen: Pick<Storage, 'getItem'>): UltimaVista | null {
  try {
    const guardado = almacen.getItem(CLAVE)
    const valor: unknown = guardado === null ? null : JSON.parse(guardado)
    return esUltimaVista(valor) ? { libro: valor.libro, cara: valor.cara } : null
  } catch (error) {
    registrarError('leer la última vista', error)
    return null
  }
}

export function guardarUltimaVista(almacen: Pick<Storage, 'setItem'>, vista: UltimaVista): void {
  try {
    almacen.setItem(CLAVE, JSON.stringify(vista))
  } catch (error) {
    registrarError('guardar la última vista', error)
  }
}
