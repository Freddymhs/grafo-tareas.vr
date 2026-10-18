// Lo que la selección dice sobre lo que frena a un nodo (FASE 15). La API dice qué lo bloquea (`GET /nodos/:id/bloqueado`);
// acá solo se decide cómo leerlo. Con varias cosas, la lista entera (17 subtareas en rojo) tapaba la vista y repetía lo
// que el grafo ya muestra: al seleccionar, la familia se ilumina alrededor. Puro.
import { LARGO_ETIQUETA, textoVisible } from './texto-visible'

export function resumenDeEspera(titulos: readonly string[]): string {
  if (titulos.length === 0) return 'Libre: nada lo frena'
  if (titulos.length === 1) return `Espera a: ${textoVisible(titulos[0] ?? '', LARGO_ETIQUETA)}`
  return `Espera a ${titulos.length} — se iluminan alrededor`
}
