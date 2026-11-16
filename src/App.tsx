import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type ReactNode } from 'react'
import { MeshBasicMaterial } from 'three'
import { conteoDeDudas } from './lib/cierre'
import { contarPiezasSinTask } from './lib/piezas'
import { coloresPorNodo } from './lib/colores'
import { LINEAS_MINIMAS } from './lib/constants/etiquetas'
import { COLOR_FONDO } from './lib/constants/grafo'
import { ERROR_LAYOUT, VIGENCIA_CONSULTA_MS } from './lib/constants/api'
import { Cara, type Grafo as GrafoDominio, type Posicion } from './lib/dominio'
import { ALTURA_OJOS, RADIO_PANORAMA } from './lib/layout'
import { FuenteGrafo, leerParametros, type ParametrosPrueba } from './lib/parametros'
import { useEstadoVr } from './lib/estado-vr'
import { type Filtro, filtroAlMostrar } from './lib/filtro'
import { guardarUltimaVista, leerUltimaVista } from './lib/ultima-vista'
import { registrarError } from './lib/registro'
import { generarGrafo } from './lib/sintetico'
import { BarraAlcance } from './escena/BarraAlcance'
import { BarraSuperior } from './escena/BarraSuperior'
import { CambioDePagina } from './escena/CambioDePagina'
import { FiltroConControl } from './escena/FiltroConControl'
import { GestoPelota } from './escena/GestoPelota'
import { GestoNumero } from './escena/GestoNumero'
import { GestoVoltear } from './escena/GestoVoltear'
import { Grafo } from './escena/Grafo'
import { Movimiento } from './escena/Movimiento'
import { useLayout } from './escena/useLayout'
import { useFiltroVr } from './escena/useFiltroVr'
import { useMapaApi } from './escena/useMapaApi'
import { VoltearConControl } from './escena/VoltearConControl'
import type { MarcaDelPlan } from './lib/plan'

// El rayo sólido y hasta la pantalla curva, con la mano y con el control: el de serie se desvanece y llega a 1 m, y
// «me cuesta mucho» apuntar (Freddy en el visor, 2026-10-18).
const RAYO_SOLIDO = {
  rayModel: {
    materialClass: MeshBasicMaterial,
    opacity: 1,
    color: '#ffffff',
    size: 0.007,
    maxLength: RADIO_PANORAMA,
  },
}
// El emulador de @react-three/xr queda apagado: lo reemplaza `lib/emulador.ts` (solo en desarrollo), porque el
// suyo no se instala sobre el WebXR nativo de Chrome. Apagado además saca del service worker ~5,9 MB de salas.
const xrStore = createXRStore({
  emulate: false,
  hand: { rayPointer: RAYO_SOLIDO },
  controller: { rayPointer: RAYO_SOLIDO },
})
const parametros = leerParametros(window.location.search)
// `?pagina=` (FASE 15) abre esa HU por su cara real; sin él, la última HU y cara que se vieron en este visor (Freddy,
// 2026-10-18: «conservar el estado en lo último que abrió»). Se guarda solo cuando cambian.
const ultimaVista = parametros.pagina === null ? leerUltimaVista(window.localStorage) : null
// La pestaña (FASE 24): `?espacio=&proyecto=` > la última vista > el primer espacio (FASE 26). Un id que ya no existe lo
// descarta `useMapaApi`.
const alcanceDeLaUrl = parametros.espacio !== null
const espacioInicial = alcanceDeLaUrl ? parametros.espacio : (ultimaVista?.espacioId ?? null)
const proyectoInicial = alcanceDeLaUrl ? parametros.proyecto : (ultimaVista?.proyectoId ?? null)
useEstadoVr.setState({
  libro: parametros.pagina ?? (alcanceDeLaUrl ? 0 : (ultimaVista?.libro ?? 0)),
  cara: ultimaVista?.cara ?? Cara.REAL,
  filtro: parametros.filtro,
  espacioId: espacioInicial,
  proyectoId: espacioInicial === null ? null : proyectoInicial,
})
useEstadoVr.subscribe(({ libro, cara, espacioId, proyectoId }, anterior) => {
  const cambio =
    libro !== anterior.libro ||
    cara !== anterior.cara ||
    espacioId !== anterior.espacioId ||
    proyectoId !== anterior.proyectoId
  if (cambio) {
    guardarUltimaVista(window.localStorage, {
      libro,
      cara,
      ...(espacioId ? { espacioId } : {}),
      ...(proyectoId ? { proyectoId } : {}),
    })
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
const SIN_MARCAS: ReadonlyMap<string, MarcaDelPlan> = new Map()

interface PropsVista {
  readonly grafo: GrafoDominio
  readonly posiciones: ReadonlyMap<string, Posicion> | null
  readonly conApi: boolean
  readonly colores: ReadonlyMap<string, string>
  readonly lineas?: number
  readonly conFecha?: ReadonlySet<string>
  /** Lo que frena en la página, según la API (filtro 4). */
  readonly frenan?: ReadonlySet<string> | null
  /** En la cara plan: el número de cada pieza y los carriles que espera. */
  readonly marcas?: ReadonlyMap<string, MarcaDelPlan>
  readonly filtro: Filtro
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
  frenan = null,
  marcas = SIN_MARCAS,
  filtro,
  fijo,
  mensaje,
}: PropsVista) {
  const [errorVr, setErrorVr] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const entrarEnVr = () => {
    setErrorVr(null)
    // Entrar trae lo último: si se salió y se volvió a entrar, no se queda con lo de antes.
    void queryClient.invalidateQueries()
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
            frenan={frenan}
            marcas={marcas}
            filtro={filtro}
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
  const { posiciones, error } = useLayout(grafo)
  const colores = useMemo(() => coloresPorNodo(grafo), [grafo])
  const filtro = useEstadoVr((estado) => estado.filtro)
  return (
    <Vista
      grafo={grafo}
      posiciones={posiciones}
      conApi={false}
      colores={colores}
      filtro={filtro}
      mensaje={error ? { texto: `${ERROR_LAYOUT}: ${error}`, esError: true } : null}
    />
  )
}

/** El grafo real (FASE 6): de la API, una página (una HU) a la vez (FASE 15), con las posiciones guardadas. */
function VistaApi() {
  const mapa = useMapaApi(parametros.reordenar, parametros.radio)
  const verCara = useEstadoVr((estado) => estado.verCara)
  const verFiltro = useEstadoVr((estado) => estado.verFiltro)
  const { filtro, filtros } = useFiltroVr()
  if (mapa.estado !== 'listo') {
    return (
      <Vista
        grafo={GRAFO_VACIO}
        posiciones={null}
        conApi
        colores={SIN_COLORES}
        filtro={filtro}
        mensaje={{ texto: mapa.mensaje, esError: mapa.estado === 'error' }}
      />
    )
  }
  // Dar vuelta la hoja (FASE 17): a la otra cara de la HU, si tiene plan; si no, nada.
  const { otra } = mapa.pagina
  const voltear = () => {
    if (otra) verCara(otra)
  }
  // Los dedos de la mano derecha (FASE 17): 2 = pendiente, 3 = sin trámites; el mismo número otra vez, todo. Solo los
  // filtros del espacio (FASE 26): en uno sin filtros, nada.
  const elegirFiltro = (numero: number) => {
    const pedido = filtroAlMostrar(numero, filtro, filtros)
    if (pedido) verFiltro(pedido)
  }
  return (
    <Vista
      grafo={mapa.grafo}
      posiciones={mapa.posiciones}
      conApi
      colores={mapa.colores}
      lineas={mapa.lineas}
      conFecha={mapa.conFecha}
      frenan={mapa.frenan}
      marcas={mapa.marcas}
      filtro={filtro}
      fijo={
        <>
          <BarraAlcance />
          <BarraSuperior
            ramas={mapa.ramas}
            indice={mapa.pagina.indice}
            cara={mapa.pagina.cara}
            otra={mapa.pagina.otra}
            dudas={conteoDeDudas(mapa.grafo.nodos)}
            piezasSinTask={contarPiezasSinTask(mapa.grafo.nodos)}
            ultimoCambio={mapa.ultimoCambio}
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
