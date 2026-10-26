// Lo que el visor le pide a la API (FASE 7): conectar dos nodos, cerrar/reabrir uno y tomar una pieza del plan. Al cerrar, primero se pregunta
// qué libera (`GET /nodos/:id/libera`, C1: la regla vive en la API) y eso queda resaltado. Toda escritura invalida
// las consultas: el mapa y la PWA leen lo mismo.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { conexionesControllerCreate } from '../lib/api/generado/conexiones/conexiones'
import { derivadoControllerLibera } from '../lib/api/generado/derivado/derivado'
import { nodosControllerUpdate } from '../lib/api/generado/nodos/nodos'
import { Cara, EstadoNodo } from '../lib/dominio'
import { useEstadoVr, type ConexionDesdeVr } from '../lib/estado-vr'

/** Lo que queda en la bitácora, como el «Movida desde la web: Plan → Trabajo» de la PWA. */
const MOTIVO_TOMAR = 'Tomada desde la VR: Plan → Trabajo'

const mensajeDe = (error: unknown) => (error instanceof Error ? error.message : String(error))

export function useAccionesVr() {
  const queryClient = useQueryClient()
  const { resaltar, avisar } = useEstadoVr.getState()
  const refrescar = () => queryClient.invalidateQueries()

  const conectar = useMutation({
    mutationFn: (datos: { origenId: string; destinoId: string; conexion: ConexionDesdeVr }) =>
      conexionesControllerCreate({
        origenId: datos.origenId,
        destinoId: datos.destinoId,
        tipo: datos.conexion,
      }),
    onSuccess: refrescar,
    onError: (error) => avisar(`No se pudo conectar: ${mensajeDe(error)}`),
  })

  const cerrar = useMutation({
    mutationFn: async (id: string) => {
      const { directos, cadena } = await derivadoControllerLibera(id)
      await nodosControllerUpdate(id, { estado: EstadoNodo.CERRADO })
      return [...directos, ...cadena].map(({ id: liberado }) => liberado)
    },
    onSuccess: (liberados) => {
      resaltar(liberados)
      avisar(liberados.length > 0 ? `Se liberan ${liberados.length}` : 'Cerrado: no liberaba nada')
      return refrescar()
    },
    onError: (error) => avisar(`No se pudo cerrar: ${mensajeDe(error)}`),
  })

  const reabrir = useMutation({
    mutationFn: (id: string) => nodosControllerUpdate(id, { estado: EstadoNodo.ABIERTO }),
    onSuccess: () => {
      resaltar([])
      avisar(null)
      return refrescar()
    },
    onError: (error) => avisar(`No se pudo reabrir: ${mensajeDe(error)}`),
  })

  // Tomar (Freddy, 2026-10-26) es el «Mover a Trabajo» de la web: la pieza pasa a la cara real de su HU, sin persona. La
  // API lo deja en la bitácora y el importador no la devuelve. Lo que no se toma queda en el plan.
  const tomar = useMutation({
    mutationFn: (id: string) =>
      nodosControllerUpdate(id, { cara: Cara.REAL, motivo: MOTIVO_TOMAR }),
    onSuccess: () => {
      useEstadoVr.setState({ seleccionado: null })
      avisar('Tomada: pasó a Trabajo')
      return refrescar()
    },
    onError: (error) => avisar(`No se pudo tomar: ${mensajeDe(error)}`),
  })

  return {
    conectar: conectar.mutate,
    tomar: tomar.mutate,
    cerrar: cerrar.mutate,
    reabrir: reabrir.mutate,
    ocupado: conectar.isPending || cerrar.isPending || reabrir.isPending || tomar.isPending,
  }
}
