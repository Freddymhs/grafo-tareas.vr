import { TipoConexion } from '../dominio'
import type { ConexionDesdeVr } from '../estado-vr'

/** Cómo se lee cada conexión desde el nodo seleccionado: "este depende de…". */
export const TEXTO_CONEXION: Readonly<Record<ConexionDesdeVr, string>> = {
  [TipoConexion.DEPENDE_DE]: 'depende de…',
  [TipoConexion.BLOQUEADA_POR]: 'bloqueada por…',
  [TipoConexion.ESPERA_RESPUESTA_DE]: 'espera respuesta de…',
}
