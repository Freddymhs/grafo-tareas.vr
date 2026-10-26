// Lo último que cambió en la página (2026-10-26), para que un cambio hecho desde otro lado —otra sesión, la web— no
// sorprenda («antes no estaba así», Freddy). Qué cambió y cuándo lo dice la API (`GET /derivado/ultimo-cambio`); acá
// solo se escribe: la hora del visor y el nombre que el nodo tiene hoy. Puro.
import type { UltimoCambioDto } from './api/generado/modelos'
import { textoVisible } from './texto-visible'

const LARGO_TITULO = 40

export function textoDelUltimoCambio(ultimo: UltimoCambioDto, tituloActual: string): string {
  const hora = new Date(ultimo.cuando).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `último cambio · ${hora} · ${textoVisible(tituloActual, LARGO_TITULO)} ${ultimo.que}`
}
