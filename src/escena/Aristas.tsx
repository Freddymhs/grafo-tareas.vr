// Todas las aristas en UNA geometría (FASE 1, D2): un `LineSegments` con un par de puntos por conexión.

import { useMemo } from 'react'
import { COLOR_ARISTA } from '../lib/constants/grafo'
import type { Conexion, Posicion } from '../lib/dominio'

const COMPONENTES_POR_VERTICE = 3

interface Props {
  readonly conexiones: readonly Conexion[]
  readonly posiciones: ReadonlyMap<string, Posicion>
  readonly opacidad: number
  /** El color de estas líneas; sin él, el de siempre. */
  readonly color?: string
}

export function Aristas({ conexiones, posiciones, opacidad, color = COLOR_ARISTA }: Props) {
  const vertices = useMemo(() => {
    const valores = conexiones.flatMap(({ origenId, destinoId }) => {
      const origen = posiciones.get(origenId)
      const destino = posiciones.get(destinoId)
      return origen && destino
        ? [origen.x, origen.y, origen.z, destino.x, destino.y, destino.z]
        : []
    })
    return new Float32Array(valores)
  }, [conexiones, posiciones])

  // Sin culling, por lo mismo que `Nodos`: la esfera de la geometría se calcula una vez y no sigue a las posiciones.
  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[vertices, COMPONENTES_POR_VERTICE]}
          count={vertices.length / COMPONENTES_POR_VERTICE}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacidad} />
    </lineSegments>
  )
}
