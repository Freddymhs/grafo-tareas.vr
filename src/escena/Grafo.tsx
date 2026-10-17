import { useMemo } from 'react'
import { coloresPorNodo } from '../lib/colores'
import { OPACIDAD_ARISTA, OPACIDAD_PERTENENCIA } from '../lib/constants/grafo'
import { TipoConexion, type Grafo as GrafoDominio, type Posicion } from '../lib/dominio'
import { Aristas } from './Aristas'
import { Etiquetas } from './Etiquetas'
import { Medidor } from './Medidor'
import { Nodos } from './Nodos'
import { useEstadoVr } from '../lib/estado-vr'
import { PanelAcciones } from './PanelAcciones'
import { Seleccion, SeleccionConBloqueo } from './Seleccion'
import { useAccionesVr } from './useAccionesVr'

interface Props {
  readonly grafo: GrafoDominio
  /** `null` mientras se calculan: se ve el medidor y nada más. */
  readonly posiciones: ReadonlyMap<string, Posicion> | null
  /** Con API: la selección pregunta qué bloquea al nodo y se puede editar (FASE 7). Sin API (sintético): solo el título. */
  readonly conApi: boolean
}

export function Grafo({ grafo, posiciones, conApi }: Props) {
  const colores = useMemo(() => coloresPorNodo(grafo), [grafo])
  const { pertenencias, relaciones } = useMemo(() => {
    const esPertenencia = ({ tipo }: { tipo: TipoConexion }) => tipo === TipoConexion.PERTENECE_A
    return {
      pertenencias: grafo.conexiones.filter(esPertenencia),
      relaciones: grafo.conexiones.filter((c) => !esPertenencia(c)),
    }
  }, [grafo])
  const seleccionado = useEstadoVr((estado) => estado.seleccionado)
  const resaltados = useEstadoVr((estado) => estado.resaltados)
  const tocar = useEstadoVr((estado) => estado.tocar)
  const { conectar } = useAccionesVr()
  const posicionSeleccionado = seleccionado ? posiciones?.get(seleccionado) : undefined
  const nodoSeleccionado = seleccionado
    ? grafo.nodos.find(({ id }) => id === seleccionado)
    : undefined
  const tocarNodo = (id: string) => {
    const toque = tocar(id)
    if (toque.accion === 'conectar' && conApi) conectar(toque)
  }

  return (
    <>
      <Medidor nodos={grafo.nodos.length} conexiones={grafo.conexiones.length} />
      {posiciones ? (
        <>
          <Nodos
            nodos={grafo.nodos}
            posiciones={posiciones}
            colores={colores}
            seleccionado={seleccionado}
            resaltados={resaltados}
            onSeleccionar={tocarNodo}
          />
          <Aristas conexiones={relaciones} posiciones={posiciones} opacidad={OPACIDAD_ARISTA} />
          <Aristas
            conexiones={pertenencias}
            posiciones={posiciones}
            opacidad={OPACIDAD_PERTENENCIA}
          />
          <Etiquetas nodos={grafo.nodos} posiciones={posiciones} excluir={seleccionado} />
          {nodoSeleccionado && posicionSeleccionado ? (
            conApi ? (
              <>
                <SeleccionConBloqueo nodo={nodoSeleccionado} posicion={posicionSeleccionado} />
                <PanelAcciones nodo={nodoSeleccionado} posicion={posicionSeleccionado} />
              </>
            ) : (
              <Seleccion nodo={nodoSeleccionado} posicion={posicionSeleccionado} detalle={null} />
            )
          ) : null}
        </>
      ) : null}
    </>
  )
}
