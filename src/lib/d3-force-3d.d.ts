// d3-force-3d no publica tipos (ni propios ni @types). Se declara SOLO lo que usa `layout.ts`.
declare module 'd3-force-3d' {
  export interface NodoSimulacion {
    id: string
    x?: number
    y?: number
    z?: number
    vx?: number
    vy?: number
  }

  export interface EnlaceSimulacion {
    source: string | NodoSimulacion
    target: string | NodoSimulacion
  }

  export interface Fuerza {
    readonly __fuerza: unique symbol
  }

  export interface FuerzaEnlace extends Fuerza {
    id(accesor: (nodo: NodoSimulacion) => string): FuerzaEnlace
    distance(distancia: number): FuerzaEnlace
    strength(fuerza: number | ((enlace: EnlaceSimulacion) => number)): FuerzaEnlace
  }

  export interface FuerzaCarga extends Fuerza {
    strength(fuerza: number): FuerzaCarga
    distanceMax(distancia: number): FuerzaCarga
  }

  export interface FuerzaChoque extends Fuerza {
    radius(radio: (nodo: NodoSimulacion) => number): FuerzaChoque
    iterations(veces: number): FuerzaChoque
  }

  /** Una fuerza propia: d3 la llama en cada tick con el alfa, después de `initialize` con los nodos. */
  export interface FuerzaPropia {
    (alfa: number): void
    initialize?: (nodos: NodoSimulacion[]) => void
  }

  export interface Simulacion {
    force(nombre: string, fuerza: Fuerza | FuerzaPropia): Simulacion
    stop(): Simulacion
    tick(iteraciones?: number): Simulacion
  }

  export function forceSimulation(nodos: NodoSimulacion[], dimensiones: number): Simulacion
  export function forceLink(enlaces: EnlaceSimulacion[]): FuerzaEnlace
  export function forceManyBody(): FuerzaCarga
  export function forceCenter(x?: number, y?: number, z?: number): Fuerza
  export function forceCollide(): FuerzaChoque
}
