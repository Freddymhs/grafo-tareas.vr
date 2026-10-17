import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// jsdom no tiene WebGL: el Canvas se reemplaza. La escena se prueba en el navegador (e2e) y en el visor.
vi.mock('@react-three/fiber', () => ({ Canvas: () => <div data-testid="lienzo" /> }))
vi.mock('@react-three/xr', () => ({
  XR: ({ children }: { children: unknown }) => children,
  createXRStore: () => ({ enterVR: vi.fn(() => Promise.reject(new Error('sin visor'))) }),
}))

// Sin API detrás: el fetch falla como falla un servidor apagado.
vi.stubGlobal(
  'fetch',
  vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
)

const { default: App } = await import('./App')

const ESPERA_REINTENTO_MS = 5000

describe('App', () => {
  it('muestra el lienzo y el botón para entrar en VR', () => {
    render(<App />)

    expect(screen.getByTestId('lienzo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar en VR' })).toBeInTheDocument()
  })

  it('si no se puede entrar en VR, lo dice en pantalla (no falla en silencio)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar en VR' }))

    expect(
      await screen.findByText('No se pudo entrar en VR: sin visor', undefined, {
        timeout: ESPERA_REINTENTO_MS,
      }),
    ).toBeInTheDocument()
  })

  it('sin API, lo dice en pantalla en vez de mostrar un mapa vacío', async () => {
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Leyendo el grafo…')
    expect(
      await screen.findByText(/No se pudo leer la API/, undefined, {
        timeout: ESPERA_REINTENTO_MS,
      }),
    ).toBeInTheDocument()
  })
})
