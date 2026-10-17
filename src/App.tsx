import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { useMemo, useState } from 'react'
import { ALTURA_OJOS } from './lib/layout'
import { leerParametros } from './lib/parametros'
import { registrarError } from './lib/registro'
import { generarGrafo } from './lib/sintetico'
import { Grafo } from './escena/Grafo'

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

function App() {
  const grafo = useMemo(() => generarGrafo(parametros), [])
  const [errorVr, setErrorVr] = useState<string | null>(null)
  const entrarEnVr = () => {
    setErrorVr(null)
    xrStore.enterVR().catch((error: unknown) => setErrorVr(registrarError('entrar en VR', error)))
  }

  return (
    <main className="relative h-svh w-full bg-slate-950">
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
          <Grafo grafo={grafo} />
        </XR>
        <OrbitControls target={OBJETIVO_ORBITA} />
      </Canvas>
    </main>
  )
}

export default App
