import { expect, test } from './helpers'

test.describe('responsive', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('no horizontal overflow and the layout stacks on mobile', async ({ page, errors }) => {
    await page.route('**/api/projects', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.goto('/')
    await page.waitForTimeout(800)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)

    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible()
    await expect(page.getByText('No projects yet. Generate your first one above.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Projects', exact: true })).toBeVisible()

    await page.getByTitle('Toggle dark mode').click()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
      .toBe(true)
    expect(errors()).toEqual([])
  })
})
