import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { VIGENCIA_CONSULTA_MS } from './lib/constants/api'
import type { Grafo as GrafoDominio, Posicion } from './lib/dominio'
import { ALTURA_OJOS } from './lib/layout'
import { FuenteGrafo, leerParametros, type ParametrosPrueba } from './lib/parametros'
import { registrarError } from './lib/registro'
import { generarGrafo } from './lib/sintetico'
import { Grafo } from './escena/Grafo'
import { Movimiento } from './escena/Movimiento'
import { useLayout } from './escena/useLayout'
import { useMapaApi } from './escena/useMapaApi'

// El emulador de @react-three/xr queda apagado: lo reemplaza `lib/emulador.ts` (solo en desarrollo), porque el
// suyo no se instala sobre el WebXR nativo de Chrome. Apagado además saca del service worker ~5,9 MB de salas.
const xrStore = createXRStore({ emulate: false })
const parametros = leerParametros(window.location.search)

const CAMARA_INICIAL: [number, number, number] = [0, ALTURA_OJOS, 0.01]
const OBJETIVO_ORBITA: [number, number, number] = [0, ALTURA_OJOS, 0]
const COLOR_FONDO = '#020617'
const LUZ_AMBIENTE = 0.7
const LUZ_DIRECCIONAL = 0.8
const POSICION_LUZ: [number, number, number] = [3, 5, 2]
/** Un reintento: si la API no está, se dice rápido en vez de esperar tres. */
const REINTENTOS = 1
const GRAFO_VACIO: GrafoDominio = { nodos: [], conexiones: [] }

interface PropsVista {
  readonly grafo: GrafoDominio
  readonly posiciones: ReadonlyMap<string, Posicion> | null
  readonly conApi: boolean
  /** Lo que se le dice al usuario mientras no hay mapa, o si algo falló. */
  readonly mensaje: { readonly texto: string; readonly esError: boolean } | null
}

function Vista({ grafo, posiciones, conApi, mensaje }: PropsVista) {
  const [errorVr, setErrorVr] = useState<string | null>(null)
  const entrarEnVr = () => {
    setErrorVr(null)
    xrStore.enterVR().catch((error: unknown) => setErrorVr(registrarError('entrar en VR', error)))
  }

  return (
    <main className="relative h-svh w-full bg-slate-950">
      {mensaje ? (
        <p
          role={mensaje.esError ? 'alert' : 'status'}
          className={`absolute top-6 left-1/2 z-10 max-w-md -translate-x-1/2 rounded px-4 py-2 text-center text-sm ${
            mensaje.esError ? 'bg-red-950 text-red-200' : 'bg-slate-800 text-slate-200'
          }`}
        >
          {mensaje.texto}
        </p>
      ) : null}
      <button
        type="button"
        onClick={entrarEnVr}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-sky-600 px-5 py-3 font-medium text-white hover:bg-sky-500"
      >
        Entrar en VR
      </button>
      {errorVr ? (
        <p
          role="alert"
          className="absolute bottom-24 left-1/2 z-10 max-w-md -translate-x-1/2 rounded bg-red-950 px-4 py-2 text-center text-sm text-red-200"
        >
          No se pudo entrar en VR: {errorVr}
        </p>
      ) : null}
      <Canvas camera={{ position: CAMARA_INICIAL, fov: 70 }}>
        <color attach="background" args={[COLOR_FONDO]} />
        <XR store={xrStore}>
          <ambientLight intensity={LUZ_AMBIENTE} />
          <directionalLight position={POSICION_LUZ} intensity={LUZ_DIRECCIONAL} />
          <Grafo grafo={grafo} posiciones={posiciones} conApi={conApi} />
          <Movimiento objetivoOrbita={OBJETIVO_ORBITA} />
        </XR>
      </Canvas>
    </main>
  )
}

/** La prueba de la FASE 1: nodos sintéticos, layout en el Worker, sin API. */
function VistaSintetica({ prueba }: { readonly prueba: ParametrosPrueba }) {
  const grafo = useMemo(() => generarGrafo(prueba), [prueba])
  const posiciones = useLayout(grafo)
  return <Vista grafo={grafo} posiciones={posiciones} conApi={false} mensaje={null} />
}

/** El grafo real (FASE 6): de la API, con las posiciones guardadas. */
function VistaApi() {
  const mapa = useMapaApi(parametros.reordenar, parametros.radio)
  if (mapa.estado !== 'listo') {
    return (
      <Vista
        grafo={GRAFO_VACIO}
        posiciones={null}
        conApi
        mensaje={{ texto: mapa.mensaje, esError: mapa.estado === 'error' }}
      />
    )
  }
  return (
    <Vista
      grafo={mapa.grafo}
      posiciones={mapa.posiciones}
      conApi
      mensaje={mapa.aviso ? { texto: mapa.aviso, esError: true } : null}
    />
  )
}

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: VIGENCIA_CONSULTA_MS,
            retry: REINTENTOS,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      {parametros.fuente === FuenteGrafo.API ? (
        <VistaApi />
      ) : (
        <VistaSintetica prueba={parametros} />
      )}
    </QueryClientProvider>
  )
}

export default App
