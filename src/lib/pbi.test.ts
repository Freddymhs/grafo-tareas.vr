import { describe, expect, it } from 'vitest'
import { EstadoNodo, Pbi, TipoNodo, type Nodo } from './dominio'
import { pbisDe } from './pbi'

const nodo = (
  id: string,
  tipo: TipoNodo,
  titulo: string,
  estado: EstadoNodo = EstadoNodo.ABIERTO,
): Nodo => ({
  id,
  tipo,
  titulo,
  estado,
})

describe('pbisDe — morado = PBI, y el que no encuentra a su otra mitad se resalta (Freddy, 2026-10-18)', () => {
  // Los títulos son los de producción del 2026-10-18.
  const pbis = pbisDe([
    nodo('fase30', TipoNodo.FASE, 'FASE 30 · Sonar Tapon · 26317'),
    nodo('fase36', TipoNodo.FASE, 'FASE 36 · Husky Extras'),
    nodo(
      't26317',
      TipoNodo.TAREA,
      '[26317] Husky esencial (FASE 30): esperar el código de las reglas de Sonar',
    ),
    nodo(
      't26750',
      TipoNodo.TAREA,
      '[26750] Sonar api.solicitudes · 101 issues (29 critical, 72 major)',
    ),
    nodo(
      't25682',
      TipoNodo.TAREA,
      '🟣 [25682] Backend - sonarqube BFF · en paralelo (husky, sesión aparte)',
    ),
    nodo('pieza', TipoNodo.TAREA, '4️⃣ 🟢 [25325] Estados y confirmar recepción'),
    nodo('nota', TipoNodo.TAREA, '[correcciones viejas] 23697 y 23698: vincular su PR'),
    nodo(
      'retro',
      TipoNodo.TAREA,
      '01-oct · retro: dependencias entre tasks — 24852 esperaba a la 24567',
    ),
    nodo('vieja', TipoNodo.TAREA, '[24001] ya cerrada sin FASE', EstadoNodo.CERRADO),
  ])

  it('la FASE con su task y la tarjeta que la encuentra: un PBI entero', () => {
    expect(pbis.get('fase30')).toBe(Pbi.ENTERO)
    expect(pbis.get('t26317')).toBe(Pbi.ENTERO)
  })

  it('la tarjeta sin FASE (se trabaja sin pensarla): a medias; está en Azure, le falta el plan', () => {
    expect(pbis.get('t26750')).toBe(Pbi.A_MEDIAS)
    expect(pbis.get('t25682')).toBe(Pbi.A_MEDIAS)
  })

  it('la FASE sin task: sin task, porque no está en Azure (Freddy, 2026-10-19: «una fase que no tiene su registro de PBI»)', () => {
    expect(pbis.get('fase36')).toBe(Pbi.SIN_TASK)
  })

  it('no es PBI lo que solo nombra un número, ni una pieza del plan que empieza con su ronda', () => {
    expect(pbis.has('nota')).toBe(false)
    expect(pbis.has('retro')).toBe(false)
    expect(pbis.has('pieza')).toBe(false)
  })

  it('lo cerrado no está a medias: ya no es un riesgo', () => {
    expect(pbis.get('vieja')).toBe(Pbi.ENTERO)
  })
})
