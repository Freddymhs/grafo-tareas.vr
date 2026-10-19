// Lo que se escribe en 3D. La fuente de `<Text>` (troika) no trae emojis y los dibuja como cajas, y los títulos
// reales de Todoist llegan a 200 caracteres: en el visor eso tapa media escena. Puro.

/** Una etiqueta flotante: lo que se lee de un vistazo. */
export const LARGO_ETIQUETA = 48
/**
 * El título del nodo seleccionado: la pregunta entera. Con 120, una duda quedaba en «¿Cambia…» y había que adivinarla
 * (Freddy en el visor, 2026-10-18; 23 de 115 títulos abiertos pasaban de 120). Solo un párrafo se corta.
 */
export const LARGO_SELECCION = 300
/** El nodo bajo el rayo (FASE 15): el título entero, salvo los que son un párrafo. */
export const LARGO_APUNTADO = 200

// Pictogramas (🔵, 🧰, ❓), selector de variante (U+FE0F), tecla de número (U+20E3), unión invisible (U+200D):
// de "2️⃣ 🔵 [25327] Bloqueo" queda "2 [25327] Bloqueo".
const SIN_GLIFO = /[\p{Extended_Pictographic}\u{FE0F}\u{20E3}\u{200D}]/gu
const ESPACIOS = /\s+/g

export function textoVisible(texto: string, largo: number): string {
  const limpio = texto.replace(SIN_GLIFO, '').replace(ESPACIOS, ' ').trim()
  return limpio.length > largo ? `${limpio.slice(0, largo - 1).trimEnd()}…` : limpio
}
