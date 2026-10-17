import { useMemo } from 'react'
import { OPACIDAD_ARISTA, OPACIDAD_ESTRUCTURA, OPACIDAD_PERTENENCIA } from '../lib/constants/grafo'
import { TipoConexion, TipoNodo, type Grafo as GrafoDominio, type Posicion } from '../lib/dominio'
import { Aristas } from './Aristas'
import { Etiquetas } from './Etiquetas'
import { Medidor } from './Medidor'
import { Nodos } from './Nodos'
import { useEstadoVr } from '../lib/estado-vr'
import { ModoEtiquetas } from '../lib/parametros'
import { PanelAcciones } from './PanelAcciones'
import { Seleccion, SeleccionConBloqueo } from './Seleccion'
import { useAccionesVr } from './useAccionesVr'

interface Props {
  readonly grafo: GrafoDominio
  /** `null` mientras se calculan: se ve el medidor y nada más. */
  readonly posiciones: ReadonlyMap<string, Posicion> | null
  /** Con API: la selección pregunta qué bloquea al nodo y se puede editar (FASE 7). Sin API (sintético): solo el título. */
  readonly conApi: boolean
  readonly etiquetas: ModoEtiquetas
  /** El color de cada nodo, calculado sobre el grafo ENTERO: en una página (FASE 15) no están las ramas. */
  readonly colores: ReadonlyMap<string, string>
}

export function Grafo({ grafo, posiciones, conApi, etiquetas, colores }: Props) {
  // Tres capas: lo que bloquea (relaciones, fuerte), el árbol tarjeta → FASE → HU (FASE 13, visible) y la
  // pertenencia a una rama de color (tenue: el color del nodo ya la dice).
  const { aRamas, arbol, relaciones } = useMemo(() => {
    const tipoDe = new Map(grafo.nodos.map(({ id, tipo }) => [id, tipo]))
    const pertenencias = grafo.conexiones.filter(({ tipo }) => tipo === TipoConexion.PERTENECE_A)
    const esARama = ({ destinoId }: { destinoId: string }) =>
      tipoDe.get(destinoId) === TipoNodo.RAMA
    return {
      aRamas: pertenencias.filter(esARama),
      arbol: pertenencias.filter((c) => !esARama(c)),
      relaciones: grafo.conexiones.filter(({ tipo }) => tipo !== TipoConexion.PERTENECE_A),
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
          <Aristas conexiones={arbol} posiciones={posiciones} opacidad={OPACIDAD_ESTRUCTURA} />
          <Aristas conexiones={aRamas} posiciones={posiciones} opacidad={OPACIDAD_PERTENENCIA} />
          <Etiquetas
            nodos={grafo.nodos}
            posiciones={posiciones}
            excluir={seleccionado}
            todas={etiquetas === ModoEtiquetas.TODAS}
          />
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
