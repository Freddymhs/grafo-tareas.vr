// Girar la pelota (FASE 15, idea de Freddy): un giro horizontal rápido de la mano izquierda cambia de HU — a la derecha
// la siguiente, a la izquierda la anterior. Puro: recibe el giro acumulado de la mano alrededor del eje vertical
// (`escena/GestoPelota.tsx` lo saca de la orientación de la muñeca) y decide.
// Calibrado con Freddy en el visor (2026-10-17, 91 s grabados con `?depurar`): sus giros son de 100° a 160° en menos de
// medio segundo, y la mano VUELVE sola enseguida (+114° y −110° al segundo). Por eso: un umbral alto que solo un giro
// decidido alcanza, y el regreso no deshace el cambio. Y solo con la mano como agarrando una pelota (pedido de Freddy:
// con la mano abierta o en puño también contaba, «demasiada sensibilidad»): `esPoseDePelota`, por la curvatura de los dedos.

/** Cuánto hay que girar (rad) y en cuánto tiempo (s) para que cuente. */
export const UMBRAL_GIRO = (70 * Math.PI) / 180
export const VENTANA_S = 0.4
/** Después de un cambio, un rato sin escuchar: un giro largo es una sola página. */
export const ENFRIAMIENTO_S = 0.6
/** Un giro al otro lado dentro de este rato es la mano volviendo, no el gesto contrario. */
export const BLOQUEO_REGRESO_S = 1.2

export interface MuestraMano {
  /** Segundos. */
  readonly t: number
  /** El giro acumulado de la mano alrededor del eje vertical (rad): positivo a la derecha. */
  readonly angulo: number
  /** Si la mano está como agarrando una pelota (`esPoseDePelota`): sin la pose, el giro no cuenta. */
  readonly enPose: boolean
}

export type EventoGesto = 'siguiente' | 'anterior'

export interface EstadoGesto {
  readonly historial: ReadonlyArray<Pick<MuestraMano, 't' | 'angulo'>>
  readonly enfriadoHasta: number
  readonly ultimo: { readonly t: number; readonly evento: EventoGesto } | null
}

export const GESTO_INICIAL: EstadoGesto = {
  historial: [],
  enfriadoHasta: Number.NEGATIVE_INFINITY,
  ultimo: null,
}

/** La diferencia de dos ángulos en (−π, π]: cruzar la espalda no es una vuelta entera. */
function diferencia(a: number, b: number): number {
  const d = (a - b) % (2 * Math.PI)
  if (d > Math.PI) return d - 2 * Math.PI
  if (d <= -Math.PI) return d + 2 * Math.PI
  return d
}

export function avanzarGesto(
  estado: EstadoGesto,
  muestra: MuestraMano,
): {
  readonly estado: EstadoGesto
  readonly evento: EventoGesto | null
  readonly progreso: number
} {
  const { t, angulo, enPose } = muestra
  // Sin la pose se suelta el giro en curso, pero se recuerda el último cambio (para no contar el regreso).
  if (!enPose) return { estado: { ...estado, historial: [] }, evento: null, progreso: 0 }
  if (t < estado.enfriadoHasta) return { estado, evento: null, progreso: 0 }

  const historial = [...estado.historial.filter((h) => t - h.t <= VENTANA_S), { t, angulo }]
  const giros = historial.map((h) => diferencia(angulo, h.angulo))
  const giro = giros.reduce((mayor, g) => (Math.abs(g) > Math.abs(mayor) ? g : mayor), 0)
  if (Math.abs(giro) < UMBRAL_GIRO) {
    return {
      estado: { ...estado, historial },
      evento: null,
      progreso: Math.abs(giro) / UMBRAL_GIRO,
    }
  }

  const evento: EventoGesto = giro > 0 ? 'siguiente' : 'anterior'
  const { ultimo } = estado
  const esElRegreso =
    ultimo !== null && ultimo.evento !== evento && t - ultimo.t < BLOQUEO_REGRESO_S
  if (esElRegreso) return { estado: { ...estado, historial: [] }, evento: null, progreso: 0 }
  return {
    estado: { historial: [], enfriadoHasta: t + ENFRIAMIENTO_S, ultimo: { t, evento } },
    evento,
    progreso: 1,
  }
}
