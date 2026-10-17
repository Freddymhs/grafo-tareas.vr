// Un número fijo por texto, sin Math.random: el mismo id cae siempre en el mismo lugar (FASE 6: «recargar dos veces da
// el mismo mapa»). Lo usan el acomodo (`layout.ts`) y los nodos nuevos (`ubicar.ts`).

const FNV_BASE = 0x811c9dc5
const FNV_PRIMO = 0x01000193
const MAXIMO_32 = 0x1_0000_0000

/** FNV-1a de 32 bits llevado a [0, 1): el mismo id da siempre el mismo número. */
export function hashUnitario(texto: string, sal = ''): number {
  const bytes = new TextEncoder().encode(`${sal}:${texto}`)
  const hash = bytes.reduce((h, byte) => Math.imul(h ^ byte, FNV_PRIMO) >>> 0, FNV_BASE)
  return hash / MAXIMO_32
}
