// Emulador de visor (IWER) para desarrollar en el PC. Se instala acá y no con el `emulate` de @react-three/xr:
// desde iwer 2.6 `installRuntime()` no pisa un `navigator.xr` nativo sin `forceInstall`, y Chrome de escritorio
// SIEMPRE trae uno (aunque no haya visor) → con el de @react-three/xr 6.6 la sesión daba "configuration not
// supported" (medido 2026-10-16). Solo en desarrollo y en localhost: en el Quest el WebXR nativo es el real.

import { registrarError } from './registro'

const HOST_DESARROLLO = 'localhost'

export async function instalarEmulador(): Promise<void> {
  if (window.location.hostname !== HOST_DESARROLLO) return
  const visorNativo = (await navigator.xr?.isSessionSupported('immersive-vr')) ?? false
  if (visorNativo) return
  const [{ XRDevice, metaQuest3 }, { DevUI }] = await Promise.all([
    import('iwer'),
    import('@iwer/devui'),
  ])
  const dispositivo = new XRDevice(metaQuest3)
  dispositivo.installRuntime({ forceInstall: true })
  dispositivo.installDevUI(DevUI)
}

export function instalarEmuladorEnDesarrollo(): void {
  if (!import.meta.env.DEV) return
  instalarEmulador().catch((error: unknown) => registrarError('instalar el emulador IWER', error))
}
