import { useMemo, useState } from 'react'
import { coloresPorNodo } from '../lib/colores'
import { OPACIDAD_ARISTA, OPACIDAD_PERTENENCIA } from '../lib/constants/grafo'
import { TipoConexion, type Grafo as GrafoDominio } from '../lib/dominio'
import { Aristas } from './Aristas'
import { Etiquetas } from './Etiquetas'
import { Medidor } from './Medidor'
import { Nodos } from './Nodos'
import { Seleccion } from './Seleccion'
import { useLayout } from './useLayout'

interface Props {
  readonly grafo: GrafoDominio
}

export function Grafo({ grafo }: Props) {
  const posiciones = useLayout(grafo)
  const colores = useMemo(() => coloresPorNodo(grafo), [grafo])
  const { pertenencias, relaciones } = useMemo(() => {
    const esPertenencia = ({ tipo }: { tipo: TipoConexion }) => tipo === TipoConexion.PERTENECE_A
    return {
      pertenencias: grafo.conexiones.filter(esPertenencia),
      relaciones: grafo.conexiones.filter((c) => !esPertenencia(c)),
    }
  }, [grafo])
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const posicionSeleccionado = seleccionado ? posiciones?.get(seleccionado) : undefined
  const alternarSeleccion = (id: string) => setSeleccionado((actual) => (actual === id ? null : id))

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
            onSeleccionar={alternarSeleccion}
          />
          <Aristas conexiones={relaciones} posiciones={posiciones} opacidad={OPACIDAD_ARISTA} />
          <Aristas
            conexiones={pertenencias}
            posiciones={posiciones}
            opacidad={OPACIDAD_PERTENENCIA}
          />
          <Etiquetas nodos={grafo.nodos} posiciones={posiciones} excluir={seleccionado} />
          {seleccionado && posicionSeleccionado ? (
            <Seleccion grafo={grafo} id={seleccionado} posicion={posicionSeleccionado} />
          ) : null}
        </>
      ) : null}
    </>
  )
}
