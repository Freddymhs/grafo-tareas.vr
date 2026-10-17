import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// jsdom no tiene WebGL: el Canvas se reemplaza. La escena se prueba en el navegador (e2e) y en el visor.
vi.mock('@react-three/fiber', () => ({ Canvas: () => <div data-testid="lienzo" /> }))
vi.mock('@react-three/xr', () => ({
  XR: ({ children }: { children: unknown }) => children,
  createXRStore: () => ({ enterVR: vi.fn(() => Promise.reject(new Error('sin visor'))) }),
}))

const { default: App } = await import('./App')

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

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo entrar en VR: sin visor')
  })
})
