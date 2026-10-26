import { useMemo } from 'react'
import {
  useDerivadoControllerFamilia,
  useDerivadoControllerHoyPuedo,
} from '../lib/api/generado/derivado/derivado'
import { colorApagado } from '../lib/colores'
import {
  OPACIDAD_APAGADA,
  OPACIDAD_ARISTA,
  OPACIDAD_ESTRUCTURA,
  OPACIDAD_ILUMINADA,
  OPACIDAD_PERTENENCIA,
} from '../lib/constants/grafo'
import {
  EstadoNodo,
  TipoConexion,
  TipoNodo,
  type Grafo as GrafoDominio,
  type Posicion,
} from '../lib/dominio'
import { idsConBorde } from '../lib/borde'
import { Aristas } from './Aristas'
import { Bordes } from './Bordes'
import { Etiquetas } from './Etiquetas'
import { MarcasDelPlan } from './MarcasDelPlan'
import { Medidor } from './Medidor'
import { Nodos } from './Nodos'
import { Pulsos } from './Pulsos'
import { useEstadoVr } from '../lib/estado-vr'
import { Filtro, encendidosPor, familiaFiltrada, hilosDelFiltro } from '../lib/filtro'
import { ModoEtiquetas } from '../lib/parametros'
import type { MarcaDelPlan } from '../lib/plan'
import { PanelAcciones } from './PanelAcciones'
import { quienesEsperan } from '../lib/seleccion'
import { Seleccion, SeleccionConBloqueo, SeleccionDeCerrado, SeleccionDePersona } from './Seleccion'
import { useAccionesVr } from './useAccionesVr'

/** El comienzo del camino: casi blanco, para que se distinga del gris de las demás relaciones. */
const COLOR_COMIENZO = '#e2e8f0'
const OPACIDAD_TENUE = 0.35

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
  /** Lo que frena en la página, según la API (filtro 4); `null` sin API o con una API anterior. */
  readonly frenan: ReadonlySet<string> | null
  /** En la cara plan: el número de cada pieza y los carriles que espera (vacío en lo real y en el sintético). */
  readonly marcas: ReadonlyMap<string, MarcaDelPlan>
}

export function Grafo({
  grafo,
  posiciones,
  conApi,
  etiquetas,
  colores,
  lineas,
  conFecha,
  frenan,
  marcas,
}: Props) {
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
  // El peso de la línea (idea de Freddy, 26-10). La que sale de algo que se puede hacer ya —lo abierto que
  // nada bloquea, según la API— es el comienzo del camino: clara y fuerte; las demás, tenues.
  const hoyPuedo = useDerivadoControllerHoyPuedo({ query: { enabled: conApi } }).data
  const { relacionesDelComienzo, relacionesTenues } = useMemo(() => {
    const libres = new Set((hoyPuedo ?? []).map(({ id }) => id))
    const esComienzo = ({ destinoId }: { destinoId: string }) =>
      libres.has(destinoId) && (frenan?.has(destinoId) ?? false)
    return {
      relacionesDelComienzo: relaciones.filter(esComienzo),
      relacionesTenues: relaciones.filter((c) => !esComienzo(c)),
    }
  }, [relaciones, hoyPuedo, frenan])
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
  // trámites) apagado con el mismo contraste. Una selección muestra su familia, recortada por el filtro: con el 1,
  // entera (el histórico); con los demás, sin lo que ya se resolvió.
  const filtro = useEstadoVr((estado) => estado.filtro)
  const porSeleccion = seleccionado !== null && familia.data !== undefined
  const porFiltro = !porSeleccion && filtro !== Filtro.TODO
  const iluminados = useMemo(() => {
    const delFiltro = encendidosPor(filtro, grafo.nodos, frenan)
    if (porSeleccion && familia.data && seleccionado) {
      return familiaFiltrada(familia.data.ids, delFiltro, seleccionado)
    }
    return porFiltro ? delFiltro : null
  }, [porSeleccion, porFiltro, filtro, familia.data, grafo, frenan, seleccionado])
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
  // El pulso sigue a lo que se ve: con un filtro o una selección, solo late en lo encendido (Freddy, 26-10: «no obedecen
  // a los filtros»).
  const relacionesIluminadas = useMemo(
    () => deLaFamilia.filter(({ tipo }) => tipo !== TipoConexion.PERTENECE_A),
    [deLaFamilia],
  )
  const conBorde = useMemo(() => idsConBorde(grafo.nodos, iluminados), [grafo, iluminados])
  const conNumero = useMemo(() => new Set(marcas.keys()), [marcas])
  const posicionSeleccionado = seleccionado ? posiciones?.get(seleccionado) : undefined
  const nodoSeleccionado = seleccionado
    ? grafo.nodos.find(({ id }) => id === seleccionado)
    : undefined
  const tocarNodo = (id: string) => {
    const toque = tocar(id)
    if (toque.accion === 'conectar' && conApi) conectar(toque)
  }

  // Un filtro oculta lo que deja fuera, no lo apaga (26-10): la página llena quedaba
  // «muy enredada» (Freddy, HU 20379: 114 nodos). Vale igual en las dos caras. La selección sigue apagando.
  const ocultos = porFiltro && iluminados ? iluminados : null
  const nodosVisibles = ocultos ? grafo.nodos.filter(({ id }) => ocultos.has(id)) : grafo.nodos

  return (
    <>
      <Medidor nodos={grafo.nodos.length} conexiones={grafo.conexiones.length} />
      {posiciones ? (
        <>
          <Nodos
            nodos={nodosVisibles}
            posiciones={posiciones}
            colores={coloresVisibles}
            seleccionado={seleccionado}
            resaltados={resaltados}
            onSeleccionar={tocarNodo}
            onApuntar={apuntar}
          />
          <MarcasDelPlan
            nodos={nodosVisibles}
            posiciones={posiciones}
            marcas={marcas}
            colores={coloresVisibles}
            seleccionado={seleccionado}
            resaltados={resaltados}
          />
          <Bordes
            nodos={nodosVisibles}
            ids={conBorde}
            posiciones={posiciones}
            seleccionado={seleccionado}
            resaltados={resaltados}
          />
          {iluminados ? (
            <>
              <Aristas
                conexiones={deLaFamilia}
                posiciones={posiciones}
                opacidad={OPACIDAD_ILUMINADA}
              />
              {ocultos ? null : (
                <Aristas
                  conexiones={fueraDeLaFamilia}
                  posiciones={posiciones}
                  opacidad={OPACIDAD_APAGADA}
                />
              )}
            </>
          ) : (
            <>
              <Aristas
                conexiones={relacionesTenues}
                posiciones={posiciones}
                opacidad={OPACIDAD_TENUE}
              />
              <Aristas
                conexiones={relacionesDelComienzo}
                posiciones={posiciones}
                opacidad={OPACIDAD_ARISTA}
                color={COLOR_COMIENZO}
              />
              <Aristas conexiones={arbol} posiciones={posiciones} opacidad={OPACIDAD_ESTRUCTURA} />
              <Aristas
                conexiones={aRamas}
                posiciones={posiciones}
                opacidad={OPACIDAD_PERTENENCIA}
              />
            </>
          )}
          <Pulsos
            conexiones={iluminados ? relacionesIluminadas : relaciones}
            posiciones={posiciones}
            frenan={frenan}
          />
          <Etiquetas
            nodos={nodosVisibles}
            posiciones={posiciones}
            excluir={seleccionado}
            todas={etiquetas === ModoEtiquetas.TODAS}
            apuntado={apuntado}
            lineas={lineas}
            iluminados={iluminados}
            conFecha={conFecha}
            conNumero={conNumero}
          />
          {nodoSeleccionado && posicionSeleccionado ? (
            conApi ? (
              <>
                {nodoSeleccionado.tipo === TipoNodo.PERSONA ? (
                  <SeleccionDePersona
                    nodo={nodoSeleccionado}
                    posicion={posicionSeleccionado}
                    esperan={quienesEsperan(nodoSeleccionado.id, grafo)}
                  />
                ) : nodoSeleccionado.estado === EstadoNodo.CERRADO ? (
                  <SeleccionDeCerrado nodo={nodoSeleccionado} posicion={posicionSeleccionado} />
                ) : (
                  <SeleccionConBloqueo nodo={nodoSeleccionado} posicion={posicionSeleccionado} />
                )}
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
