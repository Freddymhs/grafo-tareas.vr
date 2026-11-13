import { ALTO_MEDIO, ALTURA_OJOS, RADIO_PANORAMA } from '../lib/layout'

/** Delante de la pantalla (no la atraviesa) y justo encima de su banda. */
export const DISTANCIA_BARRA = RADIO_PANORAMA - 0.5
/** 35 cm sobre la banda: con 10 cm, en la banda alta los nodos de arriba la tapaban (26-10). */
export const ALTURA_BARRA = ALTURA_OJOS + ALTO_MEDIO + 0.35
