import { test, expect, type Route } from '@playwright/test'

// La VR contra la API (FASE 6), sin API real: en CI no hay. Se simula el contrato del OpenAPI con page.route.
const API = '**/api/v1'
const sobre = (data: unknown) => ({ statusCode: 200, data, meta: {} })
const nodo = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  tipo: 'TAREA',
  titulo: `Tarea ${id}`,
  estado: 'ABIERTO',
  etiquetas: [],
  posX: null,
  posY: null,
  posZ: null,
  createdAt: '2026-10-17T00:00:00.000Z',
  updatedAt: '2026-10-17T00:00:00.000Z',
  ...extra,
})
const NODOS = [nodo('a'), nodo('b'), nodo('r', { tipo: 'RAMA', titulo: 'Rama', color: '#3b82f6' })]
const CONEXIONES = [
  {
    id: 'c1',
    origenId: 'a',
    destinoId: 'b',
    tipo: 'DEPENDE_DE',
    createdAt: '2026-10-17T00:00:00.000Z',
  },
  {
    id: 'c2',
    origenId: 'a',
    destinoId: 'r',
    tipo: 'PERTENECE_A',
    createdAt: '2026-10-17T00:00:00.000Z',
  },
]
const responder = (route: Route, data: unknown) =>
  route.fulfill({ json: sobre(data), headers: { 'access-control-allow-origin': '*' } })

test('sin posiciones guardadas: arma el mapa y guarda todas en un solo PUT', async ({ page }) => {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))
  await page.route(`${API}/nodos?*`, (route) =>
    responder(route, { data: NODOS, total: NODOS.length }),
  )
  await page.route(`${API}/conexiones`, (route) => responder(route, CONEXIONES))
  const guardado = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().includes('/nodos/posiciones'),
  )
  await page.route(`${API}/nodos/posiciones`, (route) =>
    route.fulfill({
      json: sobre({ guardadas: NODOS.length }),
      headers: { 'access-control-allow-origin': '*' },
    }),
  )

  await page.goto('/')

  const cuerpo = (await guardado).postDataJSON() as { posiciones: { id: string }[] }
  expect(cuerpo.posiciones.map(({ id }) => id).sort()).toEqual(['a', 'b', 'r'])
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('status')).toHaveCount(0)
  expect(errores).toEqual([])
})

test('sin API, lo dice en vez de mostrar un mapa vacío', async ({ page }) => {
  await page.route(`${API}/**`, (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('No se pudo leer la API', { timeout: 15_000 })
})
