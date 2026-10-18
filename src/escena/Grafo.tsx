import { useMemo } from 'react'
import { useDerivadoControllerFamilia } from '../lib/api/generado/derivado/derivado'
import { colorApagado } from '../lib/colores'
import {
  OPACIDAD_APAGADA,
  OPACIDAD_ARISTA,
  OPACIDAD_ESTRUCTURA,
  OPACIDAD_ILUMINADA,
  OPACIDAD_PERTENENCIA,
} from '../lib/constants/grafo'
import { TipoConexion, TipoNodo, type Grafo as GrafoDominio, type Posicion } from '../lib/dominio'
import { Aristas } from './Aristas'
import { Etiquetas } from './Etiquetas'
import { Medidor } from './Medidor'
import { Nodos } from './Nodos'
import { useEstadoVr } from '../lib/estado-vr'
import { Filtro, encendidosPor, hilosDelFiltro } from '../lib/filtro'
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
  /** Líneas de cada etiqueta (FASE 15): las decide el acomodo de la página. */
  readonly lineas: number
  /** Las tareas sin padre: llevan su fecha (FASE 15). */
  readonly conFecha: ReadonlySet<string>
}

export function Grafo({ grafo, posiciones, conApi, etiquetas, colores, lineas, conFecha }: Props) {
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
  const apuntado = useEstadoVr((estado) => estado.apuntado)
  const apuntar = useEstadoVr((estado) => estado.apuntar)
  const { conectar } = useAccionesVr()
  // Al seleccionar (FASE 15): la API dice qué se ilumina —el nodo, lo que cuelga de él y con qué se conecta—; lo demás
  // se apaga. Sin API (la prueba sintética) no hay familia y nada se apaga.
  const familia = useDerivadoControllerFamilia(seleccionado ?? '', {
    query: { enabled: conApi && seleccionado !== null },
  })
  // Un filtro (FASE 17) ilumina como una selección: lo que quedó por hacer encendido, lo resuelto (y con el 3, los
  // trámites) apagado con el mismo contraste. Una selección manda sobre el filtro: se ve su familia.
  const filtro = useEstadoVr((estado) => estado.filtro)
  const porSeleccion = seleccionado !== null && familia.data !== undefined
  const porFiltro = !porSeleccion && filtro !== Filtro.TODO
  const iluminados = useMemo(() => {
    if (porSeleccion && familia.data) return new Set(familia.data.ids)
    return porFiltro ? encendidosPor(filtro, grafo.nodos) : null
  }, [porSeleccion, porFiltro, filtro, familia.data, grafo])
  const coloresVisibles = useMemo(
    () =>
      iluminados
        ? new Map(
            [...colores].map(([id, color]) => [
              id,
              iluminados.has(id) ? color : colorApagado(color),
            ]),
          )
        : colores,
    [colores, iluminados],
  )
  const { deLaFamilia, fueraDeLaFamilia } = useMemo(() => {
    // Con una selección, las dos puntas en su familia; con el filtro, los hilos que llevan a algo pendiente.
    const delFiltro = porFiltro && iluminados ? hilosDelFiltro(grafo.conexiones, iluminados) : null
    const adentro = (conexion: { id: string; origenId: string; destinoId: string }) =>
      delFiltro
        ? delFiltro.has(conexion.id)
        : iluminados !== null &&
          iluminados.has(conexion.origenId) &&
          iluminados.has(conexion.destinoId)
    return {
      deLaFamilia: grafo.conexiones.filter(adentro),
      fueraDeLaFamilia: grafo.conexiones.filter((c) => !adentro(c)),
    }
  }, [grafo, iluminados, porFiltro])
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
            colores={coloresVisibles}
            seleccionado={seleccionado}
            resaltados={resaltados}
            onSeleccionar={tocarNodo}
            onApuntar={apuntar}
          />
          {iluminados ? (
            <>
              <Aristas
                conexiones={deLaFamilia}
                posiciones={posiciones}
                opacidad={OPACIDAD_ILUMINADA}
              />
              <Aristas
                conexiones={fueraDeLaFamilia}
                posiciones={posiciones}
                opacidad={OPACIDAD_APAGADA}
              />
            </>
          ) : (
            <>
              <Aristas conexiones={relaciones} posiciones={posiciones} opacidad={OPACIDAD_ARISTA} />
              <Aristas conexiones={arbol} posiciones={posiciones} opacidad={OPACIDAD_ESTRUCTURA} />
              <Aristas
                conexiones={aRamas}
                posiciones={posiciones}
                opacidad={OPACIDAD_PERTENENCIA}
              />
            </>
          )}
          <Etiquetas
            nodos={grafo.nodos}
            posiciones={posiciones}
            excluir={seleccionado}
            todas={etiquetas === ModoEtiquetas.TODAS}
            apuntado={apuntado}
            lineas={lineas}
            iluminados={iluminados}
            conFecha={conFecha}
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
