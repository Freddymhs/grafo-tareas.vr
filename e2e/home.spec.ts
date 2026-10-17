import { test, expect } from '@playwright/test'

test('la escena carga y ofrece entrar en VR', async ({ page }) => {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))
  await page.goto('/?nodos=100')

  await expect(page.getByRole('button', { name: 'Entrar en VR' })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  expect(errores).toEqual([])
})
