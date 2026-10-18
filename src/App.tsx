import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { coloresPorNodo } from './lib/colores'
import { LINEAS_MINIMAS } from './lib/constants/etiquetas'
import { COLOR_FONDO } from './lib/constants/grafo'
import { VIGENCIA_CONSULTA_MS } from './lib/constants/api'
import { Cara, type Grafo as GrafoDominio, type Posicion } from './lib/dominio'
import { ALTURA_OJOS } from './lib/layout'
import { FuenteGrafo, leerParametros, type ParametrosPrueba } from './lib/parametros'
import { useEstadoVr } from './lib/estado-vr'
import { filtroDeNumero } from './lib/filtro'
import { guardarUltimaVista, leerUltimaVista } from './lib/ultima-vista'
import { registrarError } from './lib/registro'
import { generarGrafo } from './lib/sintetico'
import { BarraSuperior } from './escena/BarraSuperior'
import { CambioDePagina } from './escena/CambioDePagina'
import { FiltroConControl } from './escena/FiltroConControl'
import { GestoPelota } from './escena/GestoPelota'
import { GestoNumero } from './escena/GestoNumero'
import { GestoVoltear } from './escena/GestoVoltear'
import { Grafo } from './escena/Grafo'
import { Movimiento } from './escena/Movimiento'
import { useLayout } from './escena/useLayout'
import { useMapaApi } from './escena/useMapaApi'
import { VoltearConControl } from './escena/VoltearConControl'

// El emulador de @react-three/xr queda apagado: lo reemplaza `lib/emulador.ts` (solo en desarrollo), porque el
// suyo no se instala sobre el WebXR nativo de Chrome. Apagado además saca del service worker ~5,9 MB de salas.
const xrStore = createXRStore({ emulate: false })
const parametros = leerParametros(window.location.search)
// `?pagina=` (FASE 15) abre esa HU por su cara real; sin él, la última HU y cara que se vieron en este visor (Freddy,
// 2026-10-18: «conservar el estado en lo último que abrió»). Se guarda solo cuando cambian.
const ultimaVista = parametros.pagina === null ? leerUltimaVista(window.localStorage) : null
useEstadoVr.setState({
  libro: parametros.pagina ?? ultimaVista?.libro ?? 0,
  cara: ultimaVista?.cara ?? Cara.REAL,
  filtro: parametros.filtro,
})
useEstadoVr.subscribe(({ libro, cara }, anterior) => {
  if (libro !== anterior.libro || cara !== anterior.cara) {
    guardarUltimaVista(window.localStorage, { libro, cara })
  }
})

const CAMARA_INICIAL: [number, number, number] = [0, ALTURA_OJOS, 0.01]
const OBJETIVO_ORBITA: [number, number, number] = [0, ALTURA_OJOS, 0]
const LUZ_AMBIENTE = 0.7
const LUZ_DIRECCIONAL = 0.8
const POSICION_LUZ: [number, number, number] = [3, 5, 2]
/** Un reintento: si la API no está, se dice rápido en vez de esperar tres. */
const REINTENTOS = 1
const GRAFO_VACIO: GrafoDominio = { nodos: [], conexiones: [] }
const SIN_COLORES: ReadonlyMap<string, string> = new Map()
const NINGUNO: ReadonlySet<string> = new Set()

interface PropsVista {
  readonly grafo: GrafoDominio
  readonly posiciones: ReadonlyMap<string, Posicion> | null
  readonly conApi: boolean
  readonly colores: ReadonlyMap<string, string>
  readonly lineas?: number
  readonly conFecha?: ReadonlySet<string>
  /** Lo que va fijo en la escena además del grafo: la fila de páginas y leyenda (FASE 15). */
  readonly fijo?: ReactNode
  /** Lo que se le dice al usuario mientras no hay mapa, o si algo falló. */
  readonly mensaje: { readonly texto: string; readonly esError: boolean } | null
}

function Vista({
  grafo,
  posiciones,
  conApi,
  colores,
  lineas = LINEAS_MINIMAS,
  conFecha = NINGUNO,
  fijo,
  mensaje,
}: PropsVista) {
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
          <Grafo
            grafo={grafo}
            posiciones={posiciones}
            conApi={conApi}
            etiquetas={parametros.etiquetas}
            colores={colores}
            lineas={lineas}
            conFecha={conFecha}
          />
          {fijo}
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
  const colores = useMemo(() => coloresPorNodo(grafo), [grafo])
  return (
    <Vista grafo={grafo} posiciones={posiciones} conApi={false} colores={colores} mensaje={null} />
  )
}

/** El grafo real (FASE 6): de la API, una página (una HU) a la vez (FASE 15), con las posiciones guardadas. */
function VistaApi() {
  const mapa = useMapaApi(parametros.reordenar, parametros.radio)
  const verCara = useEstadoVr((estado) => estado.verCara)
  const verFiltro = useEstadoVr((estado) => estado.verFiltro)
  if (mapa.estado !== 'listo') {
    return (
      <Vista
        grafo={GRAFO_VACIO}
        posiciones={null}
        conApi
        colores={SIN_COLORES}
        mensaje={{ texto: mapa.mensaje, esError: mapa.estado === 'error' }}
      />
    )
  }
  // Dar vuelta la hoja (FASE 17): a la otra cara de la HU, si tiene plan; si no, nada.
  const { otra } = mapa.pagina
  const voltear = () => {
    if (otra) verCara(otra)
  }
  // Los dedos de la mano derecha (FASE 17): 1 = todo, 2 = pendiente; los demás números todavía no eligen nada.
  const elegirFiltro = (numero: number) => {
    const filtro = filtroDeNumero(numero)
    if (filtro) verFiltro(filtro)
  }
  return (
    <Vista
      grafo={mapa.grafo}
      posiciones={mapa.posiciones}
      conApi
      colores={mapa.colores}
      lineas={mapa.lineas}
      conFecha={mapa.conFecha}
      fijo={
        <>
          <BarraSuperior
            ramas={mapa.ramas}
            indice={mapa.pagina.indice}
            cara={mapa.pagina.cara}
            otra={mapa.pagina.otra}
          />
          <CambioDePagina total={mapa.pagina.total} />
          <GestoPelota total={mapa.pagina.total} depurar={parametros.depurar} />
          <GestoVoltear onVoltear={voltear} depurar={parametros.depurar} />
          <VoltearConControl onVoltear={voltear} />
          <FiltroConControl />
          <GestoNumero onNumero={elegirFiltro} depurar={parametros.depurar} />
        </>
      }
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
