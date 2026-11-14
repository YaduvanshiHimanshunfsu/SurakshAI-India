import { expect, test } from '@playwright/test'

test('Rescue and Evidence explain what to do before an analysis exists', async ({ page }) => {
  await page.goto('/rescue')
  await expect(page.getByRole('heading', { name: /Analyse something first/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Start a safety check/i })).toHaveAttribute('href', '/check')

  await page.goto('/evidence')
  await expect(page.getByRole('heading', { name: /Analyse something first/i })).toBeVisible()
  await expect(page.getByText(/encrypted Evidence Pack/i)).toBeVisible()
})

test('mobile navigation, focus, and reduced motion retain essential controls', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/check')
  await expect(page.getByRole('navigation', { name: 'Safety workflow' })).toBeVisible()
  await page.getByRole('button', { name: 'Link' }).focus()
  await expect(page.getByRole('button', { name: 'Link' })).toBeFocused()
  await expect(page.getByRole('button', { name: /Analyse safely/i })).toBeVisible()
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).scrollBehavior)).toBe('auto')
})
