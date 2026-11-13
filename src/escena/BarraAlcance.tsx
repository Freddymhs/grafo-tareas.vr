// Las pestañas de espacio y proyecto (FASE 24): dos filas de botones encima de la fila de HU. Tocar una elige el alcance
// de todo lo que se ve; «Todo» es el grafo entero. Crear espacios y proyectos es de la web.
import { SEPARACION_FILAS } from '../lib/constants/alcance'
import { useEstadoVr } from '../lib/estado-vr'
import { type Pestana, filasDeAlcance } from '../lib/filas-de-alcance'
import { ALTO_BOTON, ANCHO_BOTON, Boton3D } from './Boton3D'
import { ALTURA_BARRA, DISTANCIA_BARRA } from './medidas-barra'
import { useAlcanceVr } from './useAlcanceVr'

const SEPARACION_PESTANAS = 0.03
const PASO_DE_FILA = ALTO_BOTON + SEPARACION_FILAS

function Fila({
  pestanas,
  altura,
  elegir,
}: {
  readonly pestanas: readonly Pestana[]
  readonly altura: number
  readonly elegir: (id: string | null) => void
}) {
  const ancho = pestanas.length * (ANCHO_BOTON + SEPARACION_PESTANAS) - SEPARACION_PESTANAS
  const x = (lugar: number) =>
    -ancho / 2 + ANCHO_BOTON / 2 + lugar * (ANCHO_BOTON + SEPARACION_PESTANAS)
  return (
    <group position={[0, altura, 0]}>
      {pestanas.map(({ id, texto, activa, color }, i) => (
        <Boton3D
          key={id ?? texto}
          texto={texto}
          posicion={[x(i), 0, 0]}
          onTocar={() => elegir(id)}
          resaltado={activa}
          colorResaltado={color ?? undefined}
        />
      ))}
    </group>
  )
}

export function BarraAlcance() {
  const { alcance, espacios, proyectos } = useAlcanceVr()
  const verEspacio = useEstadoVr((estado) => estado.verEspacio)
  const verProyecto = useEstadoVr((estado) => estado.verProyecto)
  const filas = filasDeAlcance(espacios ?? [], proyectos ?? [], alcance)
  const conProyectos = filas.proyectos.length > 0

  return (
    <group position={[0, ALTURA_BARRA, -DISTANCIA_BARRA]}>
      {conProyectos ? (
        <Fila pestanas={filas.proyectos} altura={PASO_DE_FILA} elegir={verProyecto} />
      ) : null}
      <Fila
        pestanas={filas.espacios}
        altura={conProyectos ? 2 * PASO_DE_FILA : PASO_DE_FILA}
        elegir={verEspacio}
      />
    </group>
  )
}
