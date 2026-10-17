// El único lugar que escribe errores. Hoy va a la consola (en el visor se lee con `adb logcat`, tag
// `chromium`); si mañana hace falta mandarlos a la API, se cambia acá y nada más.

export function registrarError(contexto: string, error: unknown): string {
  const mensaje = error instanceof Error ? error.message : String(error)
  console.error(`[grafo-tareas.vr] ${contexto}: ${mensaje}`, error)
  return mensaje
}
