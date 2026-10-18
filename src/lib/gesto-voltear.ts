// Dar vuelta la hoja (FASE 17): cada HU tiene dos caras —lo real y el plan— y la mano izquierda ABIERTA que sube
// rápido las alterna. Puro: recibe la altura de la mano (`escena/GestoVoltear.tsx` la saca de la muñeca) y decide.
// Solo hacia ARRIBA: bajar la mano es lo que uno hace para descansarla y no tiene que disparar nada. Solo abierta, para
// no pisarse con girar la pelota (`gesto-pelota.ts`), que pide los dedos a medias. Y solo alzada, como todos los gestos.
// Los números son una primera estimación: se calibran con Freddy en el visor con `?depurar` (`window.__gestoVoltear`).

/** Cuánto hay que subir (m) y en cuánto tiempo (s) para que cuente. */
export const UMBRAL_SUBIDA_M = 0.2
export const VENTANA_S = 0.4
/** Después de una vuelta, un rato sin escuchar: un gesto largo es una sola vuelta. */
export const ENFRIAMIENTO_S = 0.8

export interface MuestraVoltear {
  /** Segundos. */
  readonly t: number
  /** La altura de la mano (m): la `y` de la muñeca. */
  readonly altura: number
  /** Si la mano está abierta (`esManoAbierta`): sin eso, la subida no cuenta. */
  readonly abierta: boolean
  /** Si la mano está a la altura del hombro (`esManoAlzada`): sin eso, tampoco. */
  readonly alzada: boolean
}

export type EventoVoltear = 'voltear'

export interface EstadoVoltear {
  readonly historial: ReadonlyArray<Pick<MuestraVoltear, 't' | 'altura'>>
  readonly enfriadoHasta: number
}

export const VOLTEAR_INICIAL: EstadoVoltear = {
  historial: [],
  enfriadoHasta: Number.NEGATIVE_INFINITY,
}

export function avanzarVoltear(
  estado: EstadoVoltear,
  muestra: MuestraVoltear,
): {
  readonly estado: EstadoVoltear
  readonly evento: EventoVoltear | null
  readonly progreso: number
} {
  const { t, altura, abierta, alzada } = muestra
  if (!abierta || !alzada)
    return { estado: { ...estado, historial: [] }, evento: null, progreso: 0 }
  if (t < estado.enfriadoHasta) return { estado, evento: null, progreso: 0 }

  const historial = [...estado.historial.filter((h) => t - h.t <= VENTANA_S), { t, altura }]
  // Cuánto subió desde el punto más bajo de la ventana; bajar nunca cuenta.
  const subida = Math.max(0, ...historial.map((h) => altura - h.altura))
  if (subida < UMBRAL_SUBIDA_M) {
    return { estado: { ...estado, historial }, evento: null, progreso: subida / UMBRAL_SUBIDA_M }
  }
  return {
    estado: { historial: [], enfriadoHasta: t + ENFRIAMIENTO_S },
    evento: 'voltear',
    progreso: 1,
  }
}
