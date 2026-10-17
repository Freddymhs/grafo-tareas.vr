// El único fetch de la app: lo usan los hooks generados por Orval (mutator). Apunta a la API por VITE_API_URL y
// desenvuelve el sobre `{ statusCode, data, meta }` de la API, así los hooks devuelven el tipo del OpenAPI.
// Es el mismo contrato que `grafo-tareas.web/src/lib/api/cliente.ts`.
import { API_URL } from '../constants/api'

interface Sobre<T> {
  readonly data: T
}

interface ErrorApi {
  readonly statusCode: number
  readonly error: string
  readonly message: string
}

export class ErrorDeApi extends Error {
  readonly statusCode: number
  readonly codigo: string

  constructor(statusCode: number, codigo: string, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorDeApi'
    this.statusCode = statusCode
    this.codigo = codigo
  }
}

const SIN_CONTENIDO = 204

export async function cliente<T>(url: string, opciones: RequestInit): Promise<T> {
  const respuesta = await fetch(`${API_URL}${url}`, opciones)
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as ErrorApi | null
    throw new ErrorDeApi(
      respuesta.status,
      cuerpo?.error ?? 'HTTP_ERROR',
      cuerpo?.message ?? `${opciones.method ?? 'GET'} ${url} respondió ${respuesta.status}`,
    )
  }
  if (respuesta.status === SIN_CONTENIDO) {
    return undefined as T
  }
  const sobre = (await respuesta.json()) as Sobre<T>
  return sobre.data
}
