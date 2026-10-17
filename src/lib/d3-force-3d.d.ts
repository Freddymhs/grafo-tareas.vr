// d3-force-3d no publica tipos (ni propios ni @types). Se declara SOLO lo que usa `layout.ts`.
declare module 'd3-force-3d' {
  export interface NodoSimulacion {
    id: string
    x?: number
    y?: number
    z?: number
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
  }

  export interface FuerzaCarga extends Fuerza {
    strength(fuerza: number): FuerzaCarga
  }

  export interface Simulacion {
    force(nombre: string, fuerza: Fuerza): Simulacion
    stop(): Simulacion
    tick(iteraciones?: number): Simulacion
  }

  export function forceSimulation(nodos: NodoSimulacion[], dimensiones: number): Simulacion
  export function forceLink(enlaces: EnlaceSimulacion[]): FuerzaEnlace
  export function forceManyBody(): FuerzaCarga
  export function forceCenter(x?: number, y?: number, z?: number): Fuerza
}
